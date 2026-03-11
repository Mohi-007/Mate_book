import requests as http_requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.config import Config
import time

news_bp = Blueprint("news", __name__, url_prefix="/api/news")

# Simple in-memory cache
_news_cache = {}
_cache_ttl = 1800  # 30 minutes for fresher news

MOCK_NEWS = [
    {
        "title": "Tech Giants Announce New AI Breakthroughs in 2026",
        "description": "Major technology companies reveal groundbreaking AI developments that could reshape industries.",
        "url": "https://example.com/tech-ai",
        "urlToImage": "https://picsum.photos/seed/news1/600/400",
        "source": {"name": "TechDaily"},
        "publishedAt": "2026-02-27T08:00:00Z",
        "category": "technology",
    },
    {
        "title": "Global Sports Championship Draws Record Viewership",
        "description": "The international championship finals attracted over 2 billion viewers worldwide.",
        "url": "https://example.com/sports",
        "urlToImage": "https://picsum.photos/seed/news2/600/400",
        "source": {"name": "SportsCentral"},
        "publishedAt": "2026-02-27T07:30:00Z",
        "category": "sports",
    },
    {
        "title": "Stock Markets Reach All-Time Highs Amid Economic Growth",
        "description": "Global financial markets continue their bullish run as economic indicators show strong growth.",
        "url": "https://example.com/business",
        "urlToImage": "https://picsum.photos/seed/news3/600/400",
        "source": {"name": "FinanceWorld"},
        "publishedAt": "2026-02-27T06:00:00Z",
        "category": "business",
    },
    {
        "title": "Blockbuster Movie Breaks Opening Weekend Records",
        "description": "The highly anticipated sequel shattered box office records with a $500M opening weekend.",
        "url": "https://example.com/entertainment",
        "urlToImage": "https://picsum.photos/seed/news4/600/400",
        "source": {"name": "EntertainmentToday"},
        "publishedAt": "2026-02-27T05:00:00Z",
        "category": "entertainment",
    },
    {
        "title": "Revolutionary Clean Energy Plant Opens in Europe",
        "description": "A new fusion energy plant begins operations, promising unlimited clean energy for millions.",
        "url": "https://example.com/science",
        "urlToImage": "https://picsum.photos/seed/news5/600/400",
        "source": {"name": "ScienceNow"},
        "publishedAt": "2026-02-27T04:00:00Z",
        "category": "technology",
    },
    {
        "title": "Health Experts Reveal New Findings on Sleep and Productivity",
        "description": "Research shows optimal sleep patterns can boost productivity by up to 40%.",
        "url": "https://example.com/health",
        "urlToImage": "https://picsum.photos/seed/news6/600/400",
        "source": {"name": "HealthWire"},
        "publishedAt": "2026-02-26T22:00:00Z",
        "category": "health",
    },
    {
        "title": "International Space Station Celebrates 30 Years in Orbit",
        "description": "NASA and international partners mark three decades of continuous human presence in space.",
        "url": "https://example.com/space",
        "urlToImage": "https://picsum.photos/seed/news7/600/400",
        "source": {"name": "SpaceNews"},
        "publishedAt": "2026-02-26T20:00:00Z",
        "category": "technology",
    },
    {
        "title": "Major Music Festival Lineup Announced for Summer 2026",
        "description": "The world's biggest music festival reveals an all-star lineup featuring top global artists.",
        "url": "https://example.com/music",
        "urlToImage": "https://picsum.photos/seed/news8/600/400",
        "source": {"name": "MusicBeat"},
        "publishedAt": "2026-02-26T18:00:00Z",
        "category": "entertainment",
    },
]


@news_bp.route("", methods=["GET"])
@jwt_required()
def get_news():
    category = request.args.get("category", "general").lower()
    cache_key = f"news_{category}"

    # Check cache
    if cache_key in _news_cache:
        cached_time, cached_data = _news_cache[cache_key]
        if time.time() - cached_time < _cache_ttl:
            return jsonify(cached_data), 200

    # Try real API with provided key
    if Config.NEWS_API_KEY:
        try:
            params = {
                "apiKey": Config.NEWS_API_KEY,
                "country": Config.NEWS_API_COUNTRY,
                "pageSize": 20,
            }
            if category != "general":
                params["category"] = category

            resp = http_requests.get(
                f"{Config.NEWS_API_URL}/top-headlines",
                params=params,
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                articles = data.get("articles", [])
                # Filter out articles with [Removed] titles
                articles = [a for a in articles if a.get("title") and a["title"] != "[Removed]"]
                result = {"articles": articles, "source": "live", "total": len(articles)}
                _news_cache[cache_key] = (time.time(), result)
                return jsonify(result), 200
        except Exception:
            pass

    # Fallback to mock data
    if category != "general":
        filtered = [n for n in MOCK_NEWS if n.get("category") == category]
    else:
        filtered = MOCK_NEWS

    result = {"articles": filtered, "source": "mock"}
    _news_cache[cache_key] = (time.time(), result)
    return jsonify(result), 200
