#!/usr/bin/env python3
"""
Script to download laws from SPIJ (Sistema Peruano de Información Jurídica)
https://spij.minjus.gob.pe/
"""

import requests
from bs4 import BeautifulSoup
import time
import json
from datetime import datetime
from pathlib import Path

# Laws to download
LAWS = [
    {"number": "27815", "name": "Código de Ética de la Función Pública", "type": "ley"},
    {"number": "28024", "name": "Gestión de Intereses", "type": "ley"},
    {"number": "26771", "name": "Nepotismo", "type": "ley"},
    {"number": "27693", "name": "UIF", "type": "ley"},
    {"number": "650", "name": "CTS", "type": "decreto-legislativo"},
    {"number": "713", "name": "Descansos Remunerados", "type": "decreto-legislativo"},
    {"number": "688", "name": "Beneficios Sociales", "type": "decreto-legislativo"},
    {"number": "892", "name": "Utilidades", "type": "decreto-legislativo"},
    {"number": "25129", "name": "Asignación Familiar", "type": "ley"},
    {"number": "27735", "name": "Gratificaciones", "type": "ley"},
    {"number": "29414", "name": "Derechos Usuarios Salud", "type": "ley"},
    {"number": "29944", "name": "Reforma Magisterial", "type": "ley"},
    {"number": "30512", "name": "Institutos Educación Superior", "type": "ley"},
    {"number": "29325", "name": "Fiscalización Ambiental", "type": "ley"},
]

BASE_URL = "https://spij.minjus.gob.pe"
OUTPUT_DIR = Path("/Users/shiara/Documents/personal-projects/legalize-pe/leyes/pe")

class SPIJScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

    def login(self):
        """Login to SPIJ"""
        login_url = f"{BASE_URL}/api/auth/login"
        payload = {
            "username": "usuarioNoPago",
            "password": "123456"
        }

        try:
            response = self.session.post(login_url, json=payload, timeout=30)
            if response.status_code == 200:
                print("✓ Login successful")
                return True
            else:
                print(f"✗ Login failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Login error: {e}")
            return False

    def search_law(self, law_info):
        """Search for a law in SPIJ"""
        number = law_info["number"]
        law_type = law_info["type"]

        # Try different search approaches
        search_terms = []

        if law_type == "ley":
            search_terms.append(f"LEY {number}")
            search_terms.append(f"LEY N° {number}")
            search_terms.append(f"LEY Nº {number}")
        elif law_type == "decreto-legislativo":
            search_terms.append(f"DECRETO LEGISLATIVO {number}")
            search_terms.append(f"D.LEG. {number}")
            search_terms.append(f"DECRETO LEGISLATIVO N° {number}")

        for term in search_terms:
            print(f"  Searching for: {term}")

            # Try the search API
            search_url = f"{BASE_URL}/api/search"
            params = {
                "query": term,
                "type": "norma"
            }

            try:
                response = self.session.get(search_url, params=params, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    if data and "results" in data and len(data["results"]) > 0:
                        return data["results"][0]
            except:
                pass

            time.sleep(1)

        return None

    def download_law_text(self, law_id):
        """Download the full text of a law"""
        text_url = f"{BASE_URL}/api/norma/{law_id}/texto"

        try:
            response = self.session.get(text_url, timeout=30)
            if response.status_code == 200:
                return response.text
        except Exception as e:
            print(f"  ✗ Error downloading text: {e}")

        return None

    def save_law(self, law_info, content, metadata):
        """Save law to file with proper frontmatter"""
        number = law_info["number"]
        law_type = law_info["type"]
        name = law_info["name"]

        # Determine identifier and filename
        if law_type == "ley":
            identifier = f"ley-{number}"
            filename = f"ley-{number}.md"
        else:
            identifier = f"decreto-legislativo-{number}"
            filename = f"decreto-legislativo-{number}.md"

        # Build frontmatter
        fecha_pub = metadata.get("fecha_publicacion", "")
        if fecha_pub:
            try:
                # Try to parse date
                fecha_obj = datetime.strptime(fecha_pub, "%d/%m/%Y")
                fecha_pub = fecha_obj.strftime("%Y-%m-%d")
            except:
                pass

        frontmatter = f"""---
titulo: "{name}"
identificador: "{identifier}"
pais: "pe"
jurisdiccion: "pe"
rango: "{law_type}"
fechaPublicacion: "{fecha_pub}"
ultimaActualizacion: "{datetime.now().strftime('%Y-%m-%d')}"
estado: "vigente"
fuente: "{BASE_URL}/"
diarioOficial: "El Peruano"
---

# {name}

{content}
"""

        # Ensure output directory exists
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        # Save file
        output_path = OUTPUT_DIR / filename
        output_path.write_text(frontmatter, encoding="utf-8")

        print(f"  ✓ Saved to {filename}")
        return True

    def process_law(self, law_info):
        """Process a single law"""
        number = law_info["number"]
        name = law_info["name"]

        print(f"\n[{number}] {name}")

        # Search for the law
        result = self.search_law(law_info)

        if not result:
            print(f"  ✗ Law not found")
            return False

        print(f"  ✓ Found: {result.get('titulo', 'N/A')}")

        # Download the text
        law_id = result.get("id")
        if not law_id:
            print(f"  ✗ No law ID found")
            return False

        content = self.download_law_text(law_id)

        if not content:
            print(f"  ✗ Failed to download text")
            return False

        print(f"  ✓ Downloaded text ({len(content)} chars)")

        # Save the law
        return self.save_law(law_info, content, result)

    def run(self):
        """Main execution"""
        print("=" * 60)
        print("SPIJ Law Downloader")
        print("=" * 60)

        # Login
        if not self.login():
            print("\n✗ Cannot proceed without login")
            return

        # Process each law
        success_count = 0
        fail_count = 0

        for law in LAWS:
            try:
                if self.process_law(law):
                    success_count += 1
                else:
                    fail_count += 1
            except Exception as e:
                print(f"  ✗ Exception: {e}")
                fail_count += 1

            # Be nice to the server
            time.sleep(2)

        # Summary
        print("\n" + "=" * 60)
        print(f"Results: {success_count} successful, {fail_count} failed")
        print("=" * 60)

if __name__ == "__main__":
    scraper = SPIJScraper()
    scraper.run()
