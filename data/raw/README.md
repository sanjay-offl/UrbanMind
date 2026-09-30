# UrbanMind Official & National Datasets

This directory contains real government datasets, official LGD administrative listings, and baseline public indicators loaded into UrbanMind BigQuery and PostgreSQL layers.

## Source Registry & Licensing

All public data from Indian government portals is utilized under the **National Data Sharing and Accessibility Policy (NDSAP)** and the **Government Open Data License - India (GODL)**:
- https://data.gov.in/sites/default/files/NDSAP.pdf
- https://data.gov.in/government-open-data-license-india

| File | Content | Official Source URL | Source Tag |
|---|---|---|---|
| `india_admin_units.json` | 36 States/UTs, 766 Districts LGD Codes & Polygons | [Local Government Directory](https://lgd.gov.in/) | `LGD_GOV` |
| `census_2011_district.csv` | District Population, SC/ST, Literacy, Sex Ratio | [Office of Registrar General & Census Commissioner](https://censusindia.gov.in/) | `CENSUS_2011` |
| `jjm_district_coverage.csv` | Functional Tap Connection Coverage % | [Jal Jeevan Mission (eJalShakti)](https://ejalshakti.gov.in/) | `JJM_API` |
| `pmgsy_road_connectivity.csv` | Rural Habitation Connectivity % | [PMGSY Online Management System](https://omms.nic.in/) | `PMGSY_API` |
| `swachh_bharat_odf.csv` | Open Defecation Free (ODF) Status | [Swachh Bharat Mission (Grameen)](https://sbm.gov.in/) | `SWACHH_API` |
| `niti_aspirational_districts.csv` | Aspirational Districts Composite Scores | [NITI Aayog Aspirational Districts Programme](https://niti.gov.in/) | `NITI_AAYOG` |
| `infrastructure_indicators.csv` | Unified Normalized Indicator Series | Unified National Indicators | Varied (`JJM_API`, `PMGSY_API`, etc.) |
| `investment_plans.csv` | District & Sectoral Planned vs Actual Allocations | State Budget Demand for Grants & Public Accounts | `BUDGET_DOCS` |

## Non-Negotiable Labeling Rule
- Every data point from an official source carries its canonical tag (`CENSUS_2011`, `JJM_API`, `PMGSY_API`, `SWACHH_API`, `NITI_AAYOG`, `BUDGET_DOCS`).
- Any synthetically generated data MUST carry the `SYNTHETIC` tag. Synthetic rows are NEVER passed off as official statistics.
