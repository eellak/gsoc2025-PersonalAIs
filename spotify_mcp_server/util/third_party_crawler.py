import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import urllib.parse
import time
from selenium.common.exceptions import WebDriverException
import requests
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MusicMapCrawler:
    """
    Crawler for fetching similar artists from music-map.com
    """
    BASE_URL = "https://www.music-map.com/"

    def __init__(self, user_agent=None):
        self.headers = {
            "User-Agent": user_agent or (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            )
        }

    def get_similar_artists(self, artist_name: str):
        """
        Get a list of similar artists from music-map.com
        :param artist_name: Artist name (in English)
        :return: List of similar artist names
        """
        url = f"{self.BASE_URL}{artist_name.replace(' ', '+')}"
        resp = requests.get(url, headers=self.headers)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        gnod_map = soup.find(id="gnodMap")
        if not gnod_map:
            return []
        similar_artists = [a.text.strip() for a in gnod_map.find_all("a")]
        return similar_artists

class BoilTheFrogCrawler:
    """
    Crawler for fetching the artist/track path from Boil the Frog (boilthefrog.playlistmachinery.com)
    """
    BASE_URL = "http://boilthefrog.playlistmachinery.com/"

    def __init__(self, user_agent=None):
        self.headers = {
            "User-Agent": user_agent or (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            )
        }
        self.chrome_options = Options()
        self.chrome_options.add_argument('--headless')
        self.chrome_options.add_argument('--no-sandbox')
        self.chrome_options.add_argument('--disable-dev-shm-usage')
        self.chrome_options.add_argument(
            'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/122.0.0.0 Safari/537.36'
        )

    def get_artist_and_track_path(self, src_artist: str, dest_artist: str):
        """
        Locate the div with id 'list', then find all divs with class 'tadiv' inside it, and extract artist and track from each tadiv.
        :param src_artist: Source artist name (in English)
        :param dest_artist: Destination artist name (in English)
        :return: List of dicts: [{"artist": ..., "track": ...}, ...]
        """
        params = {
            "src": src_artist,
            "dest": dest_artist
        }
        url = self.BASE_URL + "?" + urllib.parse.urlencode(params)
        driver = webdriver.Chrome(options=self.chrome_options)
        try:
            driver.get(url)
            # Wait until the div with id 'list' is present (max 10 seconds)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, 'list'))
            )
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, 'tadiv'))
            )
            items = []
            list_div = driver.find_element(By.ID, 'list')
            tadivs = list_div.find_elements(By.CLASS_NAME, 'tadiv')
            for tadiv in tadivs:
                try:
                    artist = tadiv.find_element(By.CLASS_NAME, 'artist').text.strip()
                except Exception:
                    artist = None
                try:
                    track = tadiv.find_element(By.CLASS_NAME, 'title').text.strip()
                except Exception:
                    track = None
                if artist and track:
                    items.append({"artist": artist, "track": track})
        except WebDriverException as e:
            logger.info(f"[ERROR] Selenium error: {e}")
            items = []
        finally:
            driver.quit()
        return items


def crawl_music_map_artists(artist_name: str):
    crawler = MusicMapCrawler()
    return crawler.get_similar_artists(artist_name)

def crawl_boil_the_frog_artists_and_tracks(src_artist: str, dest_artist= ""):
    crawler = BoilTheFrogCrawler()
    return crawler.get_artist_and_track_path(src_artist, dest_artist)


if __name__ == "__main__":
    crawler = MusicMapCrawler()
    artist = input("Enter artist name (in English): ")
    result = crawler.get_similar_artists(artist)
    logger.info("Similar artists:")
    for name in result:
        logger.info(name)

    logger.info("\n--- BoilTheFrogCrawler Artist-Track Demo ---")
    frog_crawler = BoilTheFrogCrawler()
    src = input("Enter source artist (in English): ")
    # dest = input("Enter destination artist (in English): ")
    pairs = frog_crawler.get_artist_and_track_path(src, "")
    logger.info("Artist - Track pairs:")
    for pair in pairs:
        logger.info(f"{pair['artist']} - {pair['track']}")


    logger.info('\n--- testing crawl_music_map_artists ---')
    artist_name = input("Enter artist name for music-map.com: ")
    similar_artists = crawl_music_map_artists(artist_name)
    logger.info("Similar artists from music-map.com:")
    for name in similar_artists:
        logger.info(name)
    logger.info('\n--- testing crawl_boil_the_frog_artists_and_tracks ---')
    src_artist = input("Enter source artist for Boil the Frog: ")
    pairs = crawl_boil_the_frog_artists_and_tracks(src_artist, "")
    logger.info("Artist - Track pairs from Boil the Frog:")
    for pair in pairs:
        logger.info(f"{pair['artist']} - {pair['track']}")
        
