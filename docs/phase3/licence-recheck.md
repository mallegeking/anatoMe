# Licence re-check before v1

Read on 2026-11-14. Every licence page was opened again and compared with what the repo says.

## Summary

- Sources checked: 60. These are the 49 entries in `data/citations.yaml`, BodyParts3D, Z-Anatomy, seven libraries (three.js, the shipped Draco decoder, the draco3d package, React, React Three Fiber, drei, camera-controls) and the two pages the spec marked as blocked (OpenSim full-body model, AnatomyScope).
- Differed: 4. Three citations and the OpenSim row. AnatomyScope could not be compared because it states no licence of its own.
- Changed in the repo: 3 citations in `data/citations.yaml` (pottorf-2026, park-2026, uebayashi-2026). Their pages say "Creative Commons Attribution" in words and give no number, but the licence link on each page points to the CC BY 4.0 deed. `license` now says what the page says plus the version from the link, and `license_id` is now `CC-BY-4.0` instead of `CC-BY-unversioned`. `npm run validate` passes.
- Not changed: `ATTRIBUTION.md`, `models/LICENSE` and the `credits.*` keys in `apps/web/src/i18n/en.json`. The BodyParts3D and Z-Anatomy credit lines are word for word what the pages ask for.
- Could not be reached: nothing. Every page opened. For 21 PMC articles the PMC page showed a bot check (a captcha), so the Europe PMC record of the same article was read instead. Those rows say so in the link column. This is a copy of the article's licence metadata and not the PMC page itself, so the owner may treat those rows as second hand.
- Points for the owner, not v1 blockers:
  - OpenSim full-body model: the spec says "Unknown", the simtk page shows a Stanford University 2015 permission text. The spec row could be updated before Phase 5. The simtk address was found from the project title because the spec gives no address.
  - AnatomyScope: the site states no licence for its own code or content, so the spec line still holds.
  - Z-Anatomy still credits BodyParts3D as CC-BY-SA 2.1 Japan, which is the old licence. DBCLS now states CC BY 4.0, and this repo follows DBCLS.
  - Version 4.0 for several citations comes only from the licence link on the page, not from the words (contreras-2015, osullivan-2010 for 2.0, akamatsu-2017, landfald-2026, miguel-perez-2024, ito-2025 and the three fixed rows).
  - Five citations have no version anywhere (groh-2009, kumazaki-2022, burnet-2004, bajuri-2022, van-arkel-2015-restraint). The repo records them as unversioned, which matches the pages.

## BodyParts3D and Z-Anatomy

| source | link | licence as the page states it | date read | what the repo says | match |
|---|---|---|---|---|---|
| BodyParts3D (DBCLS) | https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (address from repo docs, https://lifesciencedb.jp/bp3d/ itself is only the viewer and shows no licence text) | "The license for this database is specified in the Creative Commons Attribution 4.0 International." Page shows "updated : 2025/02/27". Note: Credit line identical, see below. Date matches spec and ATTRIBUTION.md. | 2026-11-14 | CC BY 4.0 (ATTRIBUTION.md, models/LICENSE, manifest.json) | yes |
| Z-Anatomy | https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/master/License.txt and .../master/Readme.md (files are named License.txt and Readme.md, branch master) | "All the code and content shared by 'Z-Anatomy' is under Creative Commons Attribution-ShareAlike 4.0 International License" Note: Non-commercial items listed in README, none used here. GitHub API shows License.txt last changed 2025-10-10. GitHub's own licence detector says "Other" (NOASSERTION). | 2026-11-14 | CC BY-SA 4.0 | yes |

Credit lines, word for word:

- BodyParts3D, the DBCLS page asks for "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International". `ATTRIBUTION.md` and `credits.bodyparts3d` in `en.json` use exactly this line.
- Z-Anatomy asks for "Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0". `ATTRIBUTION.md` and `credits.zanatomy` use exactly this line.
- Z-Anatomy marks some items non-commercial: the inner ear (CC-BY-NC-SA 4.0) and the kidney (CC-BY-NC 4.0). Brainder and white matter list no licence. This repo uses hip ligaments, joint capsule, acetabular labrum, bursae, four knee ligaments and menisci, so none of those items is used.

## Libraries

| source | link | licence as the page states it | date read | what the repo says | match |
|---|---|---|---|---|---|
| three | node_modules/three/LICENSE (package.json version 0.187.0) | "The MIT License  Copyright (c) 2010-2026 three.js authors" (package.json "license": "MIT") Note: Installed version 0.187.0. | 2026-11-14 | MIT (ATTRIBUTION.md) | yes |
| draco decoder (shipped) | apps/web/public/draco/LICENSE | Full text begins "Apache License Version 2.0, January 2004" Note: File has the unfilled appendix boilerplate, no copyright holder line. Decoder files: draco_decoder.js, .wasm, draco_wasm_wrapper.js. | 2026-11-14 | Apache 2.0 | yes |
| draco3d package | node_modules/draco3d/package.json (version 1.5.9) | package.json "license": "Apache-2.0" Note: No LICENSE file in the package folder (README.md only), so licence taken from package.json. | 2026-11-14 | Apache 2.0 | yes |
| react | node_modules/react/LICENSE (version 19.3.1) | "MIT License  Copyright (c) Meta Platforms, Inc. and affiliates." | 2026-11-14 | MIT (ATTRIBUTION.md, as "other npm libraries") | yes |
| @react-three/fiber | node_modules/@react-three/fiber/package.json (version 9.8.2) | package.json "license": "MIT" (no LICENSE file in the package) Note: Matches the repo's own note that the package has no licence file. | 2026-11-14 | MIT, no text shipped (ATTRIBUTION.md note) | yes |
| @react-three/drei | node_modules/@react-three/drei/LICENSE (version 10.7.9) | "MIT License  Copyright (c) 2020 react-spring" | 2026-11-14 | MIT | yes |
| camera-controls | node_modules/camera-controls/LICENSE (version 3.1.2) | "MIT License  Copyright (c) 2017 @yomotsu" | 2026-11-14 | MIT | yes |

## Citations in `data/citations.yaml`

One row each, in file order. "what the repo says" shows the `license` text and the `license_id` in brackets. The two OERI rows were also checked on the page metadata, which says "License CC BY License Version 4.0, OER program or Publisher ASCCC OERI Program". Images inside those pages carry their own licences (the 6.4 page has an OpenStax image under CC BY 3.0), but the text licence is CC BY 4.0.

| source | link | licence as the page states it | date read | what the repo says | match |
|---|---|---|---|---|---|
| oeri-human-anatomy-10-7 | https://med.libretexts.org/Bookshelves/Anatomy_and_Physiology/Human_Anatomy_(OERI)/10%3A_Muscular_System/10.07%3A_Appendicular_Muscles_of_the_Pelvic_Girdle_and_Lower_Limbs | "is shared under a CC BY 4.0 license" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| contreras-2015 | https://pmc.ncbi.nlm.nih.gov/articles/PMC4582950/ | "distributed under the terms of the Creative Commons Attribution License" (licence link points to by/4.0) | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| schenkel-2018 | https://pmc.ncbi.nlm.nih.gov/articles/PMC6132924/ | "distributed under the terms of the Creative Commons Attribution 4.0 International License" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| osullivan-2010 | https://pmc.ncbi.nlm.nih.gov/articles/PMC2912252/ | "distributed under the terms of the Creative Commons Attribution License" (licence link points to by/2.0) | 2026-11-14 | CC BY 2.0 (CC-BY-2.0) | yes |
| ito-2025 | https://pmc.ncbi.nlm.nih.gov/articles/PMC12329630/ | "open access article under the terms of the http://creativecommons.org/licenses/by-nc/4.0/ License" | 2026-11-14 | CC BY-NC 4.0 (CC-BY-NC-4.0) | yes |
| baba-2022 | https://pmc.ncbi.nlm.nih.gov/articles/PMC8725321/ | "licensed under a Creative Commons Attribution 4.0 International License" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| ng-2019 | https://pmc.ncbi.nlm.nih.gov/articles/PMC7406151/ | "Creative Commons Attribution License 4.0 (CCBY)" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| groh-2009 | https://pmc.ncbi.nlm.nih.gov/articles/PMC2697339/ | "distributed under the terms of the Creative Commons Attribution Noncommercial License" | 2026-11-14 | Creative Commons Attribution Noncommercial License (version not stated) (CC-BY-NC-unversioned) | yes |
| van-arkel-2015 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC4655836/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "open access article under the CC BY license (http://creativecommons.org/licenses/by/4.0/)" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| akamatsu-2017 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC5733974/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "distributed under the Creative Commons Attribution License" (licence link by/4.0) | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| bedard-2025 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12452698/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "Creative Commons Attribution (CC BY) license ( https://creativecommons.org/licenses/by/4.0/ )" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| pinheiro-2026 | https://pmc.ncbi.nlm.nih.gov/articles/PMC12812865/ | "open access article under the terms of the https://creativecommons.org/licenses/by/4.0/" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| kenanidis-2025 | https://pmc.ncbi.nlm.nih.gov/articles/PMC12061017/ | "licensed under a Creative Commons Attribution 4.0 International License" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| palmieri-2026 | https://pmc.ncbi.nlm.nih.gov/articles/PMC13423186/ | "Creative Commons Attribution License CC-BY 4.0" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| abouzaid-2026 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13283457/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "Creative Commons Attribution License CC-BY 4.0" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| sanchez-montoya-2025 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12346365/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "Creative Commons Attribution (CC BY) license ( https://creativecommons.org/licenses/by/4.0/ )" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| kumazaki-2022 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11250012/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "distributed under the terms of Creative Commons Attribution License (CC BY)" | 2026-11-14 | Creative Commons Attribution License (CC BY), version not stated (CC-BY-unversioned) | yes |
| perez-lloveras-2026 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13651428/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "open access article under the terms of the http://creativecommons.org/licenses/by/4.0/ License" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| obey-2016 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC4714133/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "Creative Commons Attribution-NonCommercial-NoDerivs 3.0 License" | 2026-11-14 | CC BY-NC-ND 3.0 (CC-BY-NC-ND-3.0) | yes |
| landfald-2026 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13116401/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "Creative Commons Attribution (CC BY) license" (licence link by/4.0) | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| zhong-2018 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC5908566/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "Creative Commons Attribution License 4.0 (CCBY)" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| burnet-2004 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC2395605/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "distributed under the Creative Commons Attribution License" (licence link /licenses/by/, no version) | 2026-11-14 | Creative Commons Attribution License, version not stated (CC-BY-unversioned) | yes |
| miguel-perez-2024 | https://pmc.ncbi.nlm.nih.gov/articles/PMC11353185/ | "Creative Commons Attribution (CC BY) license" (licence link by/4.0) | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| bogacka-wojcik-2025 | https://pmc.ncbi.nlm.nih.gov/articles/PMC13541974/ | "licensed under a Creative Commons Attribution 4.0 International License" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| asonganyi-eyong-2026 | https://pmc.ncbi.nlm.nih.gov/articles/PMC13332856/ | "Creative Commons Attribution License CC-BY 4.0" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| kikuchi-2025 | https://pmc.ncbi.nlm.nih.gov/articles/PMC12588184/ | "open access article under the terms of the Creative Commons Attribution licence" (link: by/4.0) | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| oeri-human-anatomy-6-4 | https://med.libretexts.org/Bookshelves/Anatomy_and_Physiology/Human_Anatomy_(OERI)/06%3A_Axial_Skeleton/6.04%3A_The_Vertebral_Column | "shared under a CC BY 4.0 license" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| posnik-2025 | https://pmc.ncbi.nlm.nih.gov/articles/PMC11765969/ | "Creative Commons Attribution (CC BY) license" (link: by/4.0) | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| piagkou-2025 | https://pmc.ncbi.nlm.nih.gov/articles/PMC12286201/ | "Creative Commons Attribution (CC BY) license" (link: by/4.0) | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| hsu-2026 | https://pmc.ncbi.nlm.nih.gov/articles/PMC13512343/ | "Creative Commons Attribution (CC BY) license" (link: by/4.0) | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| szczerba-2026 | https://pmc.ncbi.nlm.nih.gov/articles/PMC13413262/ | "Creative Commons Attribution (CC BY) license" (link: by/4.0) | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| godshaw-2019 | https://pmc.ncbi.nlm.nih.gov/articles/PMC6928675/ | "Creative Commons Attribution License (CC BY)" (link: by/4.0/legalcode) | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| bajuri-2022 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8994867/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "distributed under the terms of the Creative Commons Attribution License" (no version, no licence link) | 2026-11-14 | Creative Commons Attribution License, version not stated (CC-BY-unversioned) | yes |
| hirano-2025 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12452323/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "Creative Commons Attribution (CC BY) license", link https://creativecommons.org/licenses/by/4.0/ | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| bai-2023 | https://pmc.ncbi.nlm.nih.gov/articles/PMC10145730/ | "Creative Commons Attribution License 4.0 (CCBY)" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| arai-2026 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13623594/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "Creative Commons Attribution License (CC BY)", link https://creativecommons.org/licenses/by/4.0/ | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| van-arkel-2015-restraint | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC4491667/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "distributed under the terms of the Creative Commons CC-BY license" (no version, no licence link) | 2026-11-14 | Creative Commons CC-BY license (version not stated) (CC-BY-unversioned) | yes |
| migliorini-2024 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11662112/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "licensed under a Creative Commons Attribution 4.0 International License" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| borghi-2025 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12635949/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "Creative Commons Attribution License CC-BY 4.0" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| zhao-2026 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC13693282/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "under the terms of the http://creativecommons.org/licenses/by/4.0/ License" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| kellis-2022 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC9446565/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "licensed under a Creative Commons Attribution 4.0 International License" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| danielsson-2020 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC7526261/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "licensed under a Creative Commons Attribution 4.0 International License" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| chanel-2025 | https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12782349/fullTextXML (PMC showed a bot check, so the Europe PMC record of the same article was read) | "under the terms of the http://creativecommons.org/licenses/by/4.0/" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| zerbinati-2026 | https://pmc.ncbi.nlm.nih.gov/articles/PMC13387791/ | "Creative Commons Attribution-Non Commercial-No Derivatives License 4.0 (CCBY-NC-ND)" | 2026-11-14 | CC BY-NC-ND 4.0 (CC-BY-NC-ND-4.0) | yes |
| aali-2025 | https://pmc.ncbi.nlm.nih.gov/articles/PMC11923245/ | "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License" | 2026-11-14 | CC BY-NC-ND 4.0 (CC-BY-NC-ND-4.0) | yes |
| kato-2023 | https://pmc.ncbi.nlm.nih.gov/articles/PMC10261119/ | "licensed under a Creative Commons Attribution 4.0 International License" | 2026-11-14 | CC BY 4.0 (CC-BY-4.0) | yes |
| pottorf-2026 | https://pmc.ncbi.nlm.nih.gov/articles/PMC13179743/ | "open access article distributed under the terms of the Creative Commons Attribution License" (link: by/4.0) | 2026-11-14 | was "Creative Commons Attribution License (version not stated)", now "Creative Commons Attribution License, linked to CC BY 4.0" (CC-BY-4.0) | no, fixed |
| park-2026 | https://pmc.ncbi.nlm.nih.gov/articles/PMC13413768/ | "distributed under the terms and conditions of the Creative Commons Attribution (CC BY) license" (link: by/4.0) | 2026-11-14 | was "Creative Commons Attribution (CC BY) license (version not stated)", now "Creative Commons Attribution (CC BY) license, linked to CC BY 4.0" (CC-BY-4.0) | no, fixed |
| uebayashi-2026 | https://pmc.ncbi.nlm.nih.gov/articles/PMC13353230/ | "open access article distributed under the terms of the Creative Commons Attribution License" (link: by/4.0) | 2026-11-14 | was "Creative Commons Attribution License (version not stated)", now "Creative Commons Attribution License, linked to CC BY 4.0" (CC-BY-4.0) | no, fixed |

## Pages the spec marked as blocked

| source | link | licence as the page states it | date read | what the repo says | match |
|---|---|---|---|---|---|
| OpenSim full-body model (Rajagopal), simtk.org | https://simtk.org/projects/full_body (title "Full Body Model for use in Dynamic Simulations of Human Gait", the spec gives no address, so this is the project page found by that title) | Page "License:" box begins "Copyright (c) 2015, Stanford University  Permission is hereby granted, free of charge, to any person obtaining a copy" ... "without restriction ... sell copies" Note: Page states an MIT-style permission text (Stanford University, 2015). The word "MIT" itself did not appear in the text I read. Spec row could be updated. It matters in Phase 5 only. | 2026-11-14 | Not in the repo data. The spec says "Unknown", only matters in Phase 5. No repo file changed. | no (spec only, nothing to fix in v1) |
| AnatomyScope | https://anatomyscope.com/ , /about | Site names licences of its models only (BodyParts3D CC BY 4.0, Z-Anatomy CC BY-SA 4.0), and states no licence for the site code or content Note: Page opened fine (not blocked). Nothing states a licence for the app itself, so the spec line still holds. Built by Rivly. | 2026-11-14 | Not in the repo data. The spec says "No source code or license found". No repo file changed. | not checkable, spec line still holds |

OpenSim: the simtk page's "License:" box begins "Copyright (c) 2015, Stanford University Permission is hereby granted, free of charge, to any person obtaining a copy" and allows use "without restriction", including selling copies. The word "MIT" did not appear in the text read. The model file headers should be read before Phase 5.
