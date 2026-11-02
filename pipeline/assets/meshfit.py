"""Small geometry helpers for lining up two mesh sources.

Standard library only, so Blender's bundled Python and plain pytest can both use it.
Points are (x, y, z) tuples in metres.

A "similarity" here is a tuple (s, R, t): uniform scale s, a 3x3 rotation R
(a list of three rows) and a shift t. It moves a point p to s * R * p + t.
"""
import math

# --- Small vector and matrix helpers ---------------------------------------


def _sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def _dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def _mat_vec(m, v):
    return tuple(_dot(row, v) for row in m)


def _centroid(points):
    n = len(points)
    return (sum(p[0] for p in points) / n,
            sum(p[1] for p in points) / n,
            sum(p[2] for p in points) / n)


def rotation_about_z(angle):
    """Rotation matrix for a turn of `angle` radians around the z axis."""
    c, s = math.cos(angle), math.sin(angle)
    return [(c, -s, 0.0), (s, c, 0.0), (0.0, 0.0, 1.0)]


def apply_similarity(sim, p):
    """Move one point with a similarity (s, R, t)."""
    s, rot, t = sim
    r = _mat_vec(rot, p)
    return (s * r[0] + t[0], s * r[1] + t[1], s * r[2] + t[2])


def similarity_to_rows(sim):
    """The similarity as a 4x4 matrix (list of rows), ready for mathutils.Matrix."""
    s, rot, t = sim
    return [[s * rot[i][0], s * rot[i][1], s * rot[i][2], t[i]] for i in range(3)] + [[0, 0, 0, 1]]


def _symmetric_eigen(a, sweeps=50):
    """Eigenvalues and eigenvectors of a small symmetric matrix (Jacobi method).

    Returns (values, vectors) where vectors[k] belongs to values[k].
    """
    n = len(a)
    a = [list(row) for row in a]
    v = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    for _ in range(sweeps):
        off = sum(a[i][j] ** 2 for i in range(n) for j in range(n) if i != j)
        if off < 1e-30:
            break
        for p in range(n - 1):
            for q in range(p + 1, n):
                if abs(a[p][q]) < 1e-300:
                    continue
                theta = (a[q][q] - a[p][p]) / (2 * a[p][q])
                t = math.copysign(1.0, theta) / (abs(theta) + math.sqrt(theta * theta + 1))
                c = 1 / math.sqrt(t * t + 1)
                s = t * c
                for k in range(n):  # rotate columns p and q
                    akp, akq = a[k][p], a[k][q]
                    a[k][p], a[k][q] = c * akp - s * akq, s * akp + c * akq
                for k in range(n):  # rotate rows p and q
                    apk, aqk = a[p][k], a[q][k]
                    a[p][k], a[q][k] = c * apk - s * aqk, s * apk + c * aqk
                for k in range(n):  # collect the eigenvectors
                    vkp, vkq = v[k][p], v[k][q]
                    v[k][p], v[k][q] = c * vkp - s * vkq, s * vkp + c * vkq
    values = [a[i][i] for i in range(n)]
    vectors = [[v[k][i] for k in range(n)] for i in range(n)]
    return values, vectors


def _solve(a, b):
    """Solve a small linear system a x = b (Gaussian elimination with pivoting)."""
    n = len(b)
    m = [list(a[i]) + [b[i]] for i in range(n)]
    for col in range(n):
        piv = max(range(col, n), key=lambda r: abs(m[r][col]))
        m[col], m[piv] = m[piv], m[col]
        for r in range(col + 1, n):
            f = m[r][col] / m[col][col]
            for c in range(col, n + 1):
                m[r][c] -= f * m[col][c]
    x = [0.0] * n
    for r in range(n - 1, -1, -1):
        x[r] = (m[r][n] - sum(m[r][c] * x[c] for c in range(r + 1, n))) / m[r][r]
    return x


# --- Fits ----------------------------------------------------------------------


def fit_similarity(src, dst):
    """Best scale, rotation and shift that move the points `src` onto `dst`.

    The two lists must be matched pairs (src[i] belongs to dst[i]).
    Uses Horn's quaternion method: the rotation is the top eigenvector of a 4x4 matrix.
    """
    cs, cd = _centroid(src), _centroid(dst)
    cov = [[0.0] * 3 for _ in range(3)]  # cov[i][j] sums src axis i times dst axis j
    spread = 0.0
    for p, q in zip(src, dst):
        a, b = _sub(p, cs), _sub(q, cd)
        for i in range(3):
            for j in range(3):
                cov[i][j] += a[i] * b[j]
        spread += _dot(a, a)
    (sxx, sxy, sxz), (syx, syy, syz), (szx, szy, szz) = cov
    n = [
        [sxx + syy + szz, syz - szy, szx - sxz, sxy - syx],
        [syz - szy, sxx - syy - szz, sxy + syx, szx + sxz],
        [szx - sxz, sxy + syx, -sxx + syy - szz, syz + szy],
        [sxy - syx, szx + sxz, syz + szy, -sxx - syy + szz],
    ]
    values, vectors = _symmetric_eigen(n)
    w, x, y, z = vectors[max(range(4), key=lambda i: values[i])]
    rot = [
        (w * w + x * x - y * y - z * z, 2 * (x * y - w * z), 2 * (x * z + w * y)),
        (2 * (x * y + w * z), w * w - x * x + y * y - z * z, 2 * (y * z - w * x)),
        (2 * (x * z - w * y), 2 * (y * z + w * x), w * w - x * x - y * y + z * z),
    ]
    # Scale: how much the rotated source spread has to grow to match the target.
    s = sum(_dot(_sub(q, cd), _mat_vec(rot, _sub(p, cs))) for p, q in zip(src, dst)) / spread
    rc = _mat_vec(rot, cs)
    t = (cd[0] - s * rc[0], cd[1] - s * rc[1], cd[2] - s * rc[2])
    return (s, rot, t)


def icp_similarity(points, nearest, start, iterations=50, keep_fraction=0.9, tol=1e-9):
    """Line up `points` with a target shape when no point pairs are known (ICP).

    `nearest(p)` returns the closest target point to p. Each round moves the points
    with the current fit, pairs each one with its nearest target point, drops the
    worst pairs (keeps `keep_fraction`) and fits a new similarity to the pairs.
    Starts from the similarity `start`. Returns (fit, rms per round).
    """
    sim = start
    history = []
    for _ in range(iterations):
        pairs = []
        for p in points:
            moved = apply_similarity(sim, p)
            q = nearest(moved)
            pairs.append((_dot(_sub(moved, q), _sub(moved, q)), p, q))
        pairs.sort(key=lambda e: e[0])
        kept = pairs[:max(3, int(len(pairs) * keep_fraction))]
        history.append(math.sqrt(sum(e[0] for e in kept) / len(kept)))
        sim = fit_similarity([e[1] for e in kept], [e[2] for e in kept])
        if len(history) > 1 and abs(history[-2] - history[-1]) < tol:
            break
    return sim, history


def fit_sphere(points):
    """Least squares sphere through the points. Returns (centre, radius).

    Writes the sphere as x^2 + y^2 + z^2 = 2ax + 2by + 2cz + d, which is linear
    in a, b, c and d, so it needs no starting guess.
    """
    ata = [[0.0] * 4 for _ in range(4)]
    atb = [0.0] * 4
    for x, y, z in points:
        row = (2 * x, 2 * y, 2 * z, 1.0)
        rhs = x * x + y * y + z * z
        for i in range(4):
            atb[i] += row[i] * rhs
            for j in range(4):
                ata[i][j] += row[i] * row[j]
    a, b, c, d = _solve(ata, atb)
    return (a, b, c), math.sqrt(d + a * a + b * b + c * c)


def femoral_head_points(points, side, head_radius_guess=0.022):
    """Pick the femoral head out of a femur's vertices and fit a sphere to it.

    Left is +x and up is +z. The femoral head is the most medial (towards the
    midline) part of the top 12 cm of the femur. We start from a ball just
    lateral to that point, then keep refitting a sphere to the vertices that lie
    within 4 mm of its surface. Returns (head points, centre, radius).
    """
    top = max(p[2] for p in points)
    upper = [p for p in points if p[2] > top - 0.12]
    lateral = 1.0 if side == "l" else -1.0
    seed = min(upper, key=lambda p: lateral * p[0])
    centre = (seed[0] + lateral * head_radius_guess, seed[1], seed[2])
    head = [p for p in points if math.dist(p, centre) < head_radius_guess + 0.013]
    for _ in range(8):
        centre, radius = fit_sphere(head)
        head = [p for p in points if abs(math.dist(p, centre) - radius) < 0.004]
    if len(head) < 10:
        raise ValueError(f"femoral head search found only {len(head)} points")
    centre, radius = fit_sphere(head)
    return head, centre, radius


# --- Files -------------------------------------------------------------------


def read_obj(path, scale=1.0):
    """Vertices and triangle faces of a simple OBJ file, as stored (no axis change).

    Faces are 0-based vertex index tuples. Polygons with more corners are fanned
    into triangles. Normals and texture indices are ignored.
    """
    verts, faces = [], []
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            if line.startswith("v "):
                x, y, z = line.split()[1:4]
                verts.append((float(x) * scale, float(y) * scale, float(z) * scale))
            elif line.startswith("f "):
                idx = [int(tok.split("/")[0]) - 1 for tok in line.split()[1:]]
                for k in range(1, len(idx) - 1):
                    faces.append((idx[0], idx[k], idx[k + 1]))
    return verts, faces
