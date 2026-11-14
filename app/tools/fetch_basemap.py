#!/usr/bin/env python3
"""Download the world outline the map draws, so the app runs with no internet.

python app/tools/fetch_basemap.py

Writes app/public/basemap/land.geojson: low-detail land polygons from Natural
Earth, which is in the public domain. The file is already in the repository,
so this only needs running to refresh it.
"""
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "basemap" / "land.geojson"
LAND_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson"


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(LAND_URL, headers={"User-Agent": "straight-rows-demo"})
    with urllib.request.urlopen(request, timeout=60) as response:
        OUT.write_bytes(response.read())
    print(f"{OUT}: {OUT.stat().st_size / 1e3:.0f} kB")


if __name__ == "__main__":
    main()
