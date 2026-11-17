# German names in the data and where they come from

One row per German name in `data/structures/hip.yaml`, `data/movements.yaml` and `data/exercises.yaml`.
The names were chosen in Phase 4a from pages read on 2026-11-14. For this list each page was fetched again on 2026-11-17, and the name was looked up in the page's text (the raw HTML with the tags taken out), not in a summary of the page.

How to read the columns:

- **On the page as** is the form the page has. A name the page writes in lower case (as part of a sentence or as the meaning of the Latin) gets a capital first letter in the data, because it stands alone as a label there.
- **Combination** means that no page gives the name as a whole. The builder put it together from words that are on the page. Each word is listed with where it was found.

DocCheck Flexikon pages start with `https://flexikon.doccheck.com/de/`, German Wikipedia pages with `https://de.wikipedia.org/wiki/`. The full address is in each row.

## Structures (`data/structures/hip.yaml`)

| id | German name | Page | Read on | On the page as |
| --- | --- | --- | --- | --- |
| hip-bone | Hüftbein | https://flexikon.doccheck.com/de/Os_coxae | 2026-11-17 | Hüftbein |
| sacrum | Kreuzbein | https://de.wikipedia.org/wiki/Kreuzbein | 2026-11-17 | Kreuzbein |
| femur | Oberschenkelknochen | https://de.wikipedia.org/wiki/Oberschenkelknochen | 2026-11-17 | Oberschenkelknochen |
| patella | Kniescheibe | https://de.wikipedia.org/wiki/Kniescheibe | 2026-11-17 | Kniescheibe |
| tibia | Schienbein | https://de.wikipedia.org/wiki/Schienbein | 2026-11-17 | Schienbein |
| fibula | Wadenbein | https://de.wikipedia.org/wiki/Wadenbein | 2026-11-17 | Wadenbein |
| gluteus-maximus | Großer Gesäßmuskel | https://flexikon.doccheck.com/de/Musculus_gluteus_maximus | 2026-11-17 | Großer Gesäßmuskel |
| gluteus-medius | Mittlerer Gesäßmuskel | https://de.wikipedia.org/wiki/Musculus_gluteus_medius | 2026-11-17 | mittlerer Gesäßmuskel |
| gluteus-minimus | Kleiner Gesäßmuskel | https://flexikon.doccheck.com/de/Musculus_gluteus_minimus | 2026-11-17 | Kleiner Gesäßmuskel |
| tensor-fasciae-latae | Oberschenkelbindenspanner | https://flexikon.doccheck.com/de/Musculus_tensor_fasciae_latae | 2026-11-17 | Oberschenkelbindenspanner |
| piriformis | Birnenförmiger Muskel | https://de.wikipedia.org/wiki/Musculus_piriformis | 2026-11-17 | birnenförmiger Muskel |
| superior-gemellus | Oberer Zwillingsmuskel | https://de.wikipedia.org/wiki/Musculus_gemellus_superior | 2026-11-17 | oberer Zwillingsmuskel |
| inferior-gemellus | Unterer Zwillingsmuskel | https://de.wikipedia.org/wiki/Musculus_gemellus_inferior | 2026-11-17 | unterer Zwillingsmuskel |
| obturator-internus | Innerer Hüftlochmuskel | https://flexikon.doccheck.com/de/Musculus_obturatorius_internus | 2026-11-17 | innerer Hüftlochmuskel |
| obturator-externus | Äußerer Hüftlochmuskel | https://flexikon.doccheck.com/de/Musculus_obturatorius_externus | 2026-11-17 | äußerer Hüftlochmuskel |
| quadratus-femoris | Viereckiger Schenkelmuskel | https://de.wikipedia.org/wiki/Musculus_quadratus_femoris | 2026-11-17 | viereckiger Schenkelmuskel |
| iliacus | Darmbeinmuskel | https://de.wikipedia.org/wiki/Musculus_iliacus | 2026-11-17 | Darmbeinmuskel |
| psoas-major | Großer Lendenmuskel | https://flexikon.doccheck.com/de/Musculus_psoas_major | 2026-11-17 | großer Lendenmuskel |
| pectineus | Kammmuskel | https://flexikon.doccheck.com/de/Musculus_pectineus | 2026-11-17 | Kammmuskel |
| adductor-longus | Langer Adduktor | https://de.wikipedia.org/wiki/Musculus_adductor_magnus | 2026-11-17 | langer Adduktor |
| adductor-brevis | Kurzer Adduktor | https://de.wikipedia.org/wiki/Musculus_adductor_magnus | 2026-11-17 | kurzer Adduktor |
| adductor-magnus | Großer Adduktor | https://de.wikipedia.org/wiki/Musculus_adductor_magnus | 2026-11-17 | großer Adduktor |
| gracilis | Schlankmuskel | https://flexikon.doccheck.com/de/Musculus_gracilis | 2026-11-17 | Schlankmuskel |
| sartorius | Schneidermuskel | https://flexikon.doccheck.com/de/Musculus_sartorius | 2026-11-17 | Schneidermuskel |
| rectus-femoris | Gerader Muskel des Oberschenkels | https://de.wikipedia.org/wiki/Musculus_rectus_femoris | 2026-11-17 | gerader Muskel des Oberschenkels |
| vastus-lateralis | Seitlicher breiter Muskel | https://de.wikipedia.org/wiki/Musculus_vastus_lateralis | 2026-11-17 | seitlicher breiter Muskel |
| vastus-medialis | Innerer Schenkelmuskel | https://de.wikipedia.org/wiki/Musculus_vastus_medialis | 2026-11-17 | innerer Schenkelmuskel |
| vastus-intermedius | Mittlerer breiter Muskel | https://de.wikipedia.org/wiki/Musculus_vastus_intermedius | 2026-11-17 | mittlerer breiter Muskel |
| biceps-femoris-long-head | Langer Kopf des Musculus biceps femoris | https://de.wikipedia.org/wiki/Musculus_biceps_femoris | 2026-11-17 | Combination: "Der lange Kopf" and "Musculus biceps femoris", both on this page |
| biceps-femoris-short-head | Kurzer Kopf des Musculus biceps femoris | https://de.wikipedia.org/wiki/Musculus_biceps_femoris | 2026-11-17 | Combination: "Der kurze Kopf" and "Musculus biceps femoris", both on this page |
| semitendinosus | Halbsehnenmuskel | https://de.wikipedia.org/wiki/Musculus_semitendinosus | 2026-11-17 | Halbsehnenmuskel |
| semimembranosus | Plattsehnenmuskel | https://de.wikipedia.org/wiki/Musculus_semimembranosus | 2026-11-17 | Plattsehnenmuskel |
| iliotibial-tract | Tractus iliotibialis | https://flexikon.doccheck.com/de/Tractus_iliotibialis | 2026-11-17 | Tractus iliotibialis (the page's term, the same as the Latin) |
| iliofemoral-ligament | Darmbeinschenkelband | https://de.wikipedia.org/wiki/H%C3%BCftgelenk | 2026-11-17 | Darmbeinschenkelband |
| pubofemoral-ligament | Schambeinschenkelband | https://de.wikipedia.org/wiki/H%C3%BCftgelenk | 2026-11-17 | Schambeinschenkelband |
| ischiofemoral-ligament | Sitzbeinschenkelband | https://de.wikipedia.org/wiki/H%C3%BCftgelenk | 2026-11-17 | Sitzbeinschenkelband |
| ligament-of-head-of-femur | Hüftkopfband | https://flexikon.doccheck.com/de/Ligamentum_capitis_femoris | 2026-11-17 | Hüftkopfband |
| transverse-acetabular-ligament | Queres Pfannenband | https://de.wikipedia.org/wiki/H%C3%BCftgelenk | 2026-11-17 | Combination: the page has "Das quere Pfannenband", the data makes it "Queres Pfannenband" without the article |
| inguinal-ligament | Leistenband | https://flexikon.doccheck.com/de/Ligamentum_inguinale | 2026-11-17 | Leistenband |
| acetabular-labrum | Faserknorpellippe | https://de.wikipedia.org/wiki/H%C3%BCftgelenk | 2026-11-17 | Faserknorpellippe |
| hip-joint-capsule | Hüftgelenkskapsel | https://de.wikipedia.org/wiki/H%C3%BCftgelenk | 2026-11-17 | Hüftgelenkskapsel |
| anterior-cruciate-ligament | Vorderes Kreuzband | https://de.wikipedia.org/wiki/Kreuzband | 2026-11-17 | Vorderes Kreuzband |
| posterior-cruciate-ligament | Hinteres Kreuzband | https://de.wikipedia.org/wiki/Kreuzband | 2026-11-17 | Hinteres Kreuzband |
| medial-collateral-ligament | Innenband | https://de.wikipedia.org/wiki/Kniegelenk | 2026-11-17 | Innenband |
| lateral-collateral-ligament | Außenband | https://de.wikipedia.org/wiki/Kniegelenk | 2026-11-17 | Außenband |
| medial-meniscus | Innenmeniskus | https://de.wikipedia.org/wiki/Meniskus_(Anatomie) | 2026-11-17 | Innenmeniskus |
| lateral-meniscus | Außenmeniskus | https://de.wikipedia.org/wiki/Meniskus_(Anatomie) | 2026-11-17 | Außenmeniskus |

## Movements (`data/movements.yaml`)

All 8 movement names are combinations. No page gives any of them as a whole.

| id | German name | Page | Read on | On the page as |
| --- | --- | --- | --- | --- |
| hip-flexion | Beugung im Hüftgelenk | https://de.wikipedia.org/wiki/H%C3%BCftgelenk | 2026-11-17 | Combination: "Beugung" and "Hüftgelenk", both on this page |
| hip-extension | Streckung im Hüftgelenk | https://de.wikipedia.org/wiki/H%C3%BCftgelenk | 2026-11-17 | Combination: "Streckung" and "Hüftgelenk", both on this page |
| hip-abduction | Abspreizen im Hüftgelenk | https://flexikon.doccheck.com/de/Abduktion and https://de.wikipedia.org/wiki/H%C3%BCftgelenk | 2026-11-17 | Combination: "Abspreizen" on the Abduktion page, "Hüftgelenk" on the Hüftgelenk page |
| hip-adduction | Heranführen im Hüftgelenk | https://flexikon.doccheck.com/de/Adduktion and https://de.wikipedia.org/wiki/H%C3%BCftgelenk | 2026-11-17 | Combination: "heranführen" (lower case, as the meaning of the Latin "adducere") on the Adduktion page, "Hüftgelenk" on the Hüftgelenk page |
| hip-internal-rotation | Innenrotation im Hüftgelenk | https://flexikon.doccheck.com/de/H%C3%BCftgelenk | 2026-11-17 | Combination: "Innenrotation" and "Hüftgelenk", both on this page |
| hip-external-rotation | Außenrotation im Hüftgelenk | https://flexikon.doccheck.com/de/H%C3%BCftgelenk | 2026-11-17 | Combination: "Außenrotation" and "Hüftgelenk", both on this page |
| knee-flexion | Beugung des Kniegelenks | https://flexikon.doccheck.com/de/Kniegelenk | 2026-11-17 | Combination: the page has "Beugung und Streckung des Kniegelenks", the data takes "Beugung" and "des Kniegelenks" from it |
| knee-extension | Streckung des Kniegelenks | https://flexikon.doccheck.com/de/Kniegelenk | 2026-11-17 | Combination: the page has "Beugung und Streckung des Kniegelenks", the data takes "Streckung des Kniegelenks" from it |

## Exercises (`data/exercises.yaml`)

| id | German name | Page | Read on | On the page as |
| --- | --- | --- | --- | --- |
| bodyweight-squat | Kniebeuge | https://de.wikipedia.org/wiki/Kniebeuge | 2026-11-17 | Kniebeuge (the page is about the squat in general, not only without weights) |
| bodyweight-squat, phase lowering | Abwärtsbewegung | https://de.wikipedia.org/wiki/Kniebeuge | 2026-11-17 | Abwärtsbewegung |
| bodyweight-squat, phase rising | Aufwärtsbewegung | https://de.wikipedia.org/wiki/Kniebeuge | 2026-11-17 | Aufwärtsbewegung |

## Without a German name

These have no `german` field, because no page opened in Phase 4a gave one: the sacrotuberous ligament, the sacrospinous ligament, the trochanteric bursa, the iliopectineal bursa, the ischial bursa, and the exercise side-lying hip abduction with its two phases. The app shows the English name for them.
