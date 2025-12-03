"""Image proxy endpoints to avoid CORS issues."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import httpx
from urllib.parse import quote
import logging
import sys
import os

# Add parent directory to path for config import
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(backend_dir))
sys.path.insert(0, parent_dir)

from config import config

router = APIRouter(prefix="/images", tags=["images"])
logger = logging.getLogger(__name__)


@router.get("/location/{location_name}")
async def get_location_image(location_name: str):
    """Proxy location images from various sources to avoid CORS issues."""
    try:
        # Clean up location name
        clean_name = location_name.replace(",", "").strip()
        # Extract just the city name (before comma if present)
        city_name = location_name.split(',')[0].strip()
        
        # Build search query for location-specific images
        search_query = f"{city_name} city landscape"
        
        # Set headers to mimic a browser request
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        }
        
        # Try Unsplash API first (with credentials) for location-specific images
        unsplash_access_key = config.UNSPLASH_ACCESS_KEY
        if unsplash_access_key:
            try:
                # Step 1: Get a random photo from Unsplash based on location search
                unsplash_api_url = f"https://api.unsplash.com/photos/random"
                unsplash_params = {
                    "query": search_query,
                    "orientation": "landscape",
                    "client_id": unsplash_access_key,
                }
                
                async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                    logger.info(f"Fetching location image from Unsplash for: {city_name}")
                    api_response = await client.get(unsplash_api_url, params=unsplash_params, headers=headers)
                    
                    if api_response.status_code == 200:
                        photo_data = api_response.json()
                        # Get the actual image URL from the photo data
                        image_url = photo_data.get("urls", {}).get("regular") or photo_data.get("urls", {}).get("full")
                        
                        if image_url:
                            # Step 2: Fetch the actual image
                            logger.info(f"Fetching image from Unsplash: {image_url}")
                            image_response = await client.get(image_url, headers=headers)
                            
                            if image_response.status_code == 200 and len(image_response.content) > 0:
                                content_type = image_response.headers.get("content-type", "image/jpeg")
                                
                                logger.info(f"Successfully fetched location-specific image for {city_name}")
                                return Response(
                                    content=image_response.content,
                                    media_type=content_type,
                                    headers={
                                        "Cache-Control": "public, max-age=3600",
                                        "Access-Control-Allow-Origin": "*",
                                        "Access-Control-Allow-Methods": "GET",
                                        "Access-Control-Allow-Headers": "*",
                                    }
                                )
                    else:
                        logger.warning(f"Unsplash API returned status {api_response.status_code}: {api_response.text}")
            except Exception as e:
                logger.warning(f"Failed to fetch from Unsplash API: {str(e)}, trying fallbacks...")
        
        # Fallback image sources if Unsplash fails
        image_sources = [
            # Option 1: Picsum with location-based seed (deterministic based on location)
            f"https://picsum.photos/seed/{hash(city_name) % 10000}/800/600",
            # Option 2: Placeholder.com with location name
            f"https://via.placeholder.com/800x600/4A90E2/FFFFFF?text={quote(city_name)}",
        ]
        
        last_error = None
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            # Try each image source
            for idx, img_url in enumerate(image_sources):
                try:
                    logger.info(f"Trying to fetch image from source {idx+1}: {img_url}")
                    
                    # Skip Unsplash API endpoint if it requires auth (we'll handle it differently)
                    if "api.unsplash.com" in img_url:
                        # Unsplash API requires authentication, skip for now
                        # In production, you'd add: headers["Authorization"] = f"Client-ID {UNSPLASH_API_KEY}"
                        logger.info("Skipping Unsplash API (requires auth)")
                        continue
                    
                    response = await client.get(img_url, headers=headers)
                    
                    if response.status_code == 200 and len(response.content) > 0:
                        # Check if response is actually an image
                        content_type = response.headers.get("content-type", "").lower()
                        
                        # If not an image, try to determine from content
                        if not content_type.startswith("image/"):
                            # Check if content looks like an image (starts with image magic bytes)
                            if len(response.content) >= 4:
                                content_bytes = response.content[:4]
                                if content_bytes.startswith(b'\xff\xd8\xff'):  # JPEG
                                    content_type = "image/jpeg"
                                elif content_bytes.startswith(b'\x89PNG'):  # PNG
                                    content_type = "image/png"
                                elif content_bytes.startswith(b'GIF8'):  # GIF
                                    content_type = "image/gif"
                                elif content_bytes.startswith(b'RIFF') and b'WEBP' in response.content[:12]:  # WEBP
                                    content_type = "image/webp"
                                else:
                                    # Default to jpeg if we can't determine
                                    content_type = "image/jpeg"
                            else:
                                content_type = "image/jpeg"
                        
                        # Return image with proper headers to avoid CORB
                        logger.info(f"Successfully fetched image, content-type: {content_type}")
                        return Response(
                            content=response.content,
                            media_type=content_type,
                            headers={
                                "Cache-Control": "public, max-age=3600",
                                "Access-Control-Allow-Origin": "*",
                                "Access-Control-Allow-Methods": "GET",
                                "Access-Control-Allow-Headers": "*",
                            }
                        )
                    else:
                        logger.warning(f"Image source returned status {response.status_code}")
                        last_error = f"Status {response.status_code}"
                        
                except httpx.TimeoutException:
                    logger.warning(f"Timeout fetching from {img_url}")
                    last_error = "Timeout"
                    continue
                except httpx.RequestError as e:
                    logger.warning(f"Request error fetching from {img_url}: {str(e)}")
                    last_error = str(e)
                    continue
                except Exception as e:
                    logger.warning(f"Error fetching from {img_url}: {str(e)}")
                    last_error = str(e)
                    continue
        
        # If all sources failed, return a simple placeholder SVG
        logger.warning(f"All image sources failed for {location_name}, returning placeholder")
        placeholder_svg = f"""<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="#E5E7EB"/>
  <text x="400" y="300" font-family="Arial, sans-serif" font-size="24" fill="#6B7280" text-anchor="middle">{clean_name}</text>
</svg>"""
        
        return Response(
            content=placeholder_svg.encode('utf-8'),
            media_type="image/svg+xml",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*",
            }
        )
            
    except Exception as e:
        logger.error(f"Unexpected error in get_location_image: {str(e)}", exc_info=True)
        # Return a simple error placeholder
        error_svg = f"""<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="#F3F4F6"/>
  <text x="400" y="300" font-family="Arial, sans-serif" font-size="20" fill="#9CA3AF" text-anchor="middle">Image unavailable</text>
</svg>"""
        return Response(
            content=error_svg.encode('utf-8'),
            media_type="image/svg+xml",
            headers={
                "Cache-Control": "no-cache",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*",
            }
        )
