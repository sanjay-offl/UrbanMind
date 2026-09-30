"""Orchestrate all national public data loaders for UrbanMind BigQuery dataset."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from census_loader import load_census_data
from jjm_loader import load_jjm_data
from pmgsy_loader import load_pmgsy_data
from swachh_loader import load_swachh_data
from niti_loader import load_niti_data


def run_all():
    print("=== Running UrbanMind National Data Loaders ===")
    c1 = load_census_data()
    c2 = load_jjm_data()
    c3 = load_pmgsy_data()
    c4 = load_swachh_data()
    c5 = load_niti_data()
    print("=== All Public Data Loaders Completed Successfully ===")
    return {"census": c1, "jjm": c2, "pmgsy": c3, "swachh": c4, "niti": c5}


if __name__ == "__main__":
    run_all()
