// PR #4 branch (before merge)
const BASE_URL = "https://raw.githubusercontent.com/The-Japan-DataScientist-Society/skills-checklist/refs/pull/4/head/"

// After PR is merged, switch to:
// const BASE_URL = "https://raw.githubusercontent.com/The-Japan-DataScientist-Society/skills-checklist/master/"

const SHEET_URLS = {
  foundation:        BASE_URL + "foundation.csv",
  value_creation:    BASE_URL + "value_creation.csv",
  data_science:      BASE_URL + "data_science.csv",
  data_engineering:  BASE_URL + "data_engineering.csv",
  fusion:            BASE_URL + "fusion.csv",
}
