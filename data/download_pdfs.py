#!/usr/bin/env python3
"""
Download PDFs from CSV file and organize them in folder structure matching CSV categories
"""
import csv
import os
import urllib.request
import urllib.parse
from pathlib import Path
import time
from typing import Optional, List, Dict
import re
import json
import random

# Try to use requests library if available (better redirect handling)
try:
    import requests
    from bs4 import BeautifulSoup
    HAS_REQUESTS = True
    HAS_BS4 = True
except ImportError:
    HAS_REQUESTS = False
    HAS_BS4 = False
    print("WARNING: 'requests' or 'beautifulsoup4' library not found.")
    print("         Install with: pip install requests beautifulsoup4")
    print("         Using urllib (may have issues with redirects)")

# Try to use Playwright for web scraping (better at avoiding captchas)
try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False
    print("WARNING: 'playwright' library not found.")
    print("         Install with: pip install playwright")
    print("         Then run: playwright install chromium")
    print("         Will fall back to requests (may hit captchas)")


def sanitize_filename(name: str) -> str:
    """Sanitize filename to remove invalid characters"""
    if not name:
        return "unknown"
    # Remove invalid characters for filenames
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        name = name.replace(char, '_')
    # Remove leading/trailing spaces and dots
    name = name.strip('. ')
    # Replace multiple spaces/underscores with single underscore
    while '__' in name:
        name = name.replace('__', '_')
    return name or "unknown"


def get_filename_from_url(url: str, category: str, subcategory: str) -> str:
    """Extract filename from URL or create one from category/subcategory"""
    if not url or not url.strip():
        return None
    
    # Try to get filename from URL
    parsed = urllib.parse.urlparse(url.strip())
    path = parsed.path
    
    if path and path.endswith('.pdf'):
        filename = os.path.basename(path)
        # Decode URL-encoded characters
        filename = urllib.parse.unquote(filename)
    else:
        # Create filename from category/subcategory
        if subcategory and subcategory.strip():
            filename = f"{sanitize_filename(subcategory)}.pdf"
        elif category and category.strip():
            filename = f"{sanitize_filename(category)}.pdf"
        else:
            filename = "document.pdf"
    
    return sanitize_filename(filename)


def create_request(url: str, follow_redirects: bool = True):
    """Create a urllib request with proper headers"""
    req = urllib.request.Request(url)
    req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    req.add_header('Accept', 'application/pdf,application/octet-stream,*/*')
    req.add_header('Accept-Language', 'en-US,en;q=0.9')
    req.add_header('Referer', 'https://www.indiacode.nic.in/')
    return req


def follow_redirects(url: str, max_redirects: int = 5) -> Optional[str]:
    """Follow HTTP redirects and return final URL"""
    current_url = url
    redirect_count = 0
    
    while redirect_count < max_redirects:
        try:
            req = create_request(current_url, follow_redirects=False)
            req.get_method = lambda: 'HEAD'  # Use HEAD to avoid downloading
            
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    return current_url
                elif response.status in [301, 302, 303, 307, 308]:
                    redirect_url = response.headers.get('Location')
                    if not redirect_url:
                        return None
                    
                    # Handle relative redirects
                    if redirect_url.startswith('/'):
                        parsed = urllib.parse.urlparse(current_url)
                        redirect_url = f"{parsed.scheme}://{parsed.netloc}{redirect_url}"
                    elif not redirect_url.startswith('http'):
                        redirect_url = urllib.parse.urljoin(current_url, redirect_url)
                    
                    current_url = redirect_url
                    redirect_count += 1
                else:
                    return None
        except Exception as e:
            return None
    
    return current_url if redirect_count < max_redirects else None


def search_with_playwright(query: str, max_results: int = 5) -> List[str]:
    """Search DuckDuckGo using Playwright and extract PDF links"""
    if not HAS_PLAYWRIGHT:
        return []
    
    pdf_urls = []
    
    try:
        print(f"    [SEARCH] Using Playwright browser to avoid captchas...")
        search_query = f"{query} filetype:pdf"
        search_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(search_query)}"
        
        print(f"    [SEARCH] Query: {search_query}")
        print(f"    [SEARCH] Loading page with Playwright...")
        
        with sync_playwright() as p:
            # Launch browser with realistic settings
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled'
                ]
            )
            
            # Create context with realistic browser fingerprint
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                locale='en-US',
                timezone_id='America/New_York',
                permissions=[],
                extra_http_headers={
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                }
            )
            
            page = context.new_page()
            
            # Navigate to search page
            page.goto(search_url, wait_until='networkidle', timeout=30000)
            
            # Wait a bit for page to fully render
            page.wait_for_timeout(2000)
            
            # Check for captcha
            page_content = page.content().lower()
            if 'captcha' in page_content or 'challenge' in page_content:
                print(f"    [SEARCH] ⚠ WARNING: Captcha detected, trying requests fallback...")
                browser.close()
                return []
            
            print(f"    [SEARCH] ✓ Page loaded successfully")
            
            # Get page source and parse with BeautifulSoup
            if HAS_BS4:
                html_content = page.content()
                soup = BeautifulSoup(html_content, 'html.parser')
                
                # Find all result links
                all_links = soup.find_all('a', href=True)
                print(f"    [SEARCH] Found {len(all_links)} total links in results")
                
                link_count = 0
                for link in all_links:
                    url = link.get('href', '')
                    
                    # Handle DuckDuckGo redirect URLs
                    if 'duckduckgo.com/l/?uddg=' in url:
                        try:
                            parsed = urllib.parse.urlparse(url)
                            query_params = urllib.parse.parse_qs(parsed.query)
                            if 'uddg' in query_params:
                                actual_url = urllib.parse.unquote(query_params['uddg'][0])
                                print(f"    [SEARCH] Extracted redirect URL: {actual_url[:60]}...")
                                url = actual_url
                        except Exception as e:
                            print(f"    [SEARCH] ⚠ Could not extract redirect: {e}")
                            continue
                    
                    # Only add PDF URLs
                    if url.startswith('http') and (url.endswith('.pdf') or '.pdf' in url.lower()):
                        if url not in pdf_urls:
                            link_count += 1
                            pdf_urls.append(url)
                            print(f"    [SEARCH] ✓ Link #{link_count}: {url[:70]}...")
                            if len(pdf_urls) >= max_results:
                                print(f"    [SEARCH] Reached max results ({max_results})")
                                break
                
                # Remove duplicates while preserving order
                seen = set()
                unique_urls = []
                for url in pdf_urls:
                    if url not in seen:
                        seen.add(url)
                        unique_urls.append(url)
                        if len(unique_urls) >= max_results:
                            break
                
                print(f"    [SEARCH] ✓ Total unique PDF links found: {len(unique_urls)}")
                browser.close()
                return unique_urls[:max_results]
            else:
                browser.close()
                print(f"    [SEARCH] ⚠ BeautifulSoup not available")
                return []
                
    except PlaywrightTimeoutError:
        print(f"    [SEARCH] ✗ Timeout waiting for page to load")
        return []
    except Exception as e:
        print(f"    [SEARCH] ✗ Playwright error: {e}")
        import traceback
        print(f"    [SEARCH] Traceback: {traceback.format_exc()}")
        return []


def search_duckduckgo_html(query: str, max_results: int = 5) -> List[str]:
    """Search DuckDuckGo HTML and extract PDF links - returns first 5 PDF links"""
    pdf_urls = []
    
    # Try Playwright first (best at avoiding captchas)
    if HAS_PLAYWRIGHT:
        result = search_with_playwright(query, max_results)
        if result:
            return result
        # If Playwright fails, fall through to requests
    
    # Fallback to requests if Selenium fails or not available
    if not HAS_REQUESTS:
        print("    ✗ ERROR: requests library not available")
        return pdf_urls
    
    try:
        # Create search query with filetype:pdf
        search_query = f"{query} filetype:pdf"
        search_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(search_query)}"
        
        print(f"    [SEARCH] Falling back to requests method...")
        print(f"    [SEARCH] Query: {search_query}")
        print(f"    [SEARCH] URL: {search_url[:80]}...")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        }
        
        print(f"    [SEARCH] Sending request to DuckDuckGo...")
        response = requests.get(search_url, headers=headers, timeout=15)
        response.raise_for_status()
        print(f"    [SEARCH] ✓ Response received (status: {response.status_code})")
        
        if HAS_BS4:
            print(f"    [SEARCH] Parsing HTML response...")
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all result links
            all_links = soup.find_all('a', href=True)
            print(f"    [SEARCH] Found {len(all_links)} total links in results")
            
            link_count = 0
            for link in all_links:
                url = link.get('href', '')
                
                # Handle DuckDuckGo redirect URLs
                if 'duckduckgo.com/l/?uddg=' in url:
                    try:
                        parsed = urllib.parse.urlparse(url)
                        query_params = urllib.parse.parse_qs(parsed.query)
                        if 'uddg' in query_params:
                            actual_url = urllib.parse.unquote(query_params['uddg'][0])
                            print(f"    [SEARCH] Extracted redirect URL: {actual_url[:60]}...")
                            url = actual_url
                    except Exception as e:
                        print(f"    [SEARCH] ⚠ Could not extract redirect: {e}")
                        continue
                
                # Only add PDF URLs
                if url.startswith('http') and (url.endswith('.pdf') or '.pdf' in url.lower()):
                    if url not in pdf_urls:
                        link_count += 1
                        pdf_urls.append(url)
                        print(f"    [SEARCH] ✓ Link #{link_count}: {url[:70]}...")
                        if len(pdf_urls) >= max_results:
                            print(f"    [SEARCH] Reached max results ({max_results})")
                            break
        else:
            print(f"    [SEARCH] ⚠ BeautifulSoup not available, using regex fallback")
            # Fallback: regex search for PDF URLs
            pdf_pattern = r'https?://[^\s<>"]+\.pdf'
            matches = re.findall(pdf_pattern, response.text)
            pdf_urls.extend(matches)
            print(f"    [SEARCH] Found {len(matches)} PDF URLs via regex")
        
        # Remove duplicates while preserving order
        seen = set()
        unique_urls = []
        for url in pdf_urls:
            if url not in seen:
                seen.add(url)
                unique_urls.append(url)
                if len(unique_urls) >= max_results:
                    break
        
        print(f"    [SEARCH] ✓ Total unique PDF links found: {len(unique_urls)}")
        return unique_urls[:max_results]
        
    except requests.exceptions.RequestException as e:
        print(f"    [SEARCH] ✗ Request error: {e}")
        return []
    except Exception as e:
        print(f"    [SEARCH] ✗ Error: {e}")
        import traceback
        print(f"    [SEARCH] Traceback: {traceback.format_exc()}")
        return []


def search_google_custom(query: str, max_results: int = 10) -> List[str]:
    """Search using Google (via DuckDuckGo's !g bang)"""
    # DuckDuckGo supports Google search via !g
    google_query = f"!g {query} filetype:pdf"
    return search_duckduckgo_html(google_query, max_results)


def search_indiacode_direct(act_name: str, filename: str) -> List[str]:
    """Search indiacode.nic.in directly for the document"""
    pdf_urls = []
    
    if not HAS_REQUESTS:
        return pdf_urls
    
    try:
        # Try to search indiacode.nic.in
        search_query = f"{act_name} {filename}"
        search_url = f"https://www.indiacode.nic.in/handle/123456789/search?q={urllib.parse.quote(search_query)}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
        
        response = requests.get(search_url, headers=headers, timeout=15)
        
        if HAS_BS4:
            soup = BeautifulSoup(response.text, 'html.parser')
            # Look for PDF links
            for link in soup.find_all('a', href=True):
                url = link.get('href', '')
                if url.endswith('.pdf') or '/bitstream/' in url:
                    if not url.startswith('http'):
                        url = urllib.parse.urljoin('https://www.indiacode.nic.in', url)
                    if url not in pdf_urls:
                        pdf_urls.append(url)
        
        return pdf_urls[:5]
    except Exception as e:
        return []


def search_web_for_pdf(act_name: str, filename: str, category: str = "") -> List[str]:
    """Search DuckDuckGo for PDF documents - returns first 5 links"""
    print(f"    [WEB SEARCH] Starting search for document...")
    print(f"    [WEB SEARCH] Act Name: {act_name}")
    print(f"    [WEB SEARCH] Filename: {filename}")
    print(f"    [WEB SEARCH] Category: {category}")
    
    # Create search string from document name
    # Use act_name (subcategory) or filename as primary search term
    search_term = act_name if act_name else filename
    
    # Remove common suffixes like ".pdf" from filename for better search
    if search_term.endswith('.pdf'):
        search_term = search_term[:-4]
        print(f"    [WEB SEARCH] Removed .pdf suffix from search term")
    
    # Add "india" and "act" if not already present for better results
    search_query = f"{search_term} pdf india"
    
    print(f"    [WEB SEARCH] Final search query: '{search_query}'")
    
    # Search DuckDuckGo and get first 5 PDF links
    pdf_urls = search_duckduckgo_html(search_query, max_results=5)
    
    print(f"    [WEB SEARCH] Search complete. Returning {len(pdf_urls)} links.")
    return pdf_urls


def try_alternative_urls(act_name: str, filename: str, filepath: Path, category: str = "") -> bool:
    """Search DuckDuckGo for document, get first 5 links, download from first working one"""
    print(f"\n    {'='*70}")
    print(f"    [WEB SEARCH] Starting web search for document")
    print(f"    {'='*70}")
    print(f"    Document: {act_name or filename}")
    print(f"    Target file: {filepath.name}")
    
    # Get first 5 PDF links from DuckDuckGo search
    pdf_urls = search_web_for_pdf(act_name, filename, category)
    
    if pdf_urls:
        print(f"\n    [DOWNLOAD] Found {len(pdf_urls)} PDF links, trying them in order...")
        print(f"    {'-'*70}")
        for idx, pdf_url in enumerate(pdf_urls, 1):
            print(f"\n    [DOWNLOAD] Attempt {idx}/{len(pdf_urls)}")
            print(f"    [DOWNLOAD] URL: {pdf_url[:70]}...")
            if download_pdf(pdf_url, filepath, max_retries=1, search_alternatives=False):
                print(f"    [DOWNLOAD] ✓✓✓ SUCCESS! Downloaded from link #{idx} ✓✓✓")
                print(f"    [DOWNLOAD] Saved to: {filepath}")
                return True
            else:
                print(f"    [DOWNLOAD] ✗ Link #{idx} failed")
            time.sleep(0.5)  # Small delay between attempts
        
        print(f"\n    [DOWNLOAD] ✗✗✗ All {len(pdf_urls)} links failed ✗✗✗")
    else:
        print(f"\n    [WEB SEARCH] ✗✗✗ No PDF links found in search results ✗✗✗")
    
    print(f"    {'='*70}\n")
    return False


def fix_indiacode_url(url: str) -> str:
    """Fix common issues with indiacode.nic.in URLs"""
    # Remove trailing spaces
    url = url.strip()
    
    # Ensure proper encoding
    if '%20' in url:
        url = urllib.parse.unquote(url)
        url = urllib.parse.quote(url, safe=':/?#[]@!$&\'()*+,;=')
    
    return url


def handle_special_urls(url: str) -> Optional[str]:
    """Handle special URLs that need different handling"""
    # Income Tax Act - this is an .aspx page, not a direct PDF
    if 'incometaxindia.gov.in' in url and 'income-tax-act.aspx' in url:
        # Try to find the actual PDF link - for now return None to skip
        print(f"  ⚠ Special URL detected (Income Tax Act - .aspx page, skipping)")
        return None
    
    # Fix indiacode URLs
    if 'indiacode.nic.in' in url:
        url = fix_indiacode_url(url)
    
    return url


def download_pdf(url: str, filepath: Path, max_retries: int = 3, search_alternatives: bool = False, act_name: str = "", filename: str = "") -> bool:
    """Download PDF from URL with retries and proper headers"""
    if not url or not url.strip():
        return False
    
    url = url.strip()
    
    # Handle special URLs
    url = handle_special_urls(url)
    if url is None:
        return False
    
    # Use requests library if available (much better redirect handling)
    if HAS_REQUESTS:
        return download_pdf_with_requests(url, filepath, max_retries, search_alternatives, act_name, filename)
    else:
        return download_pdf_with_urllib(url, filepath, max_retries, search_alternatives, act_name, filename)


def download_pdf_with_requests(url: str, filepath: Path, max_retries: int = 3, search_alternatives: bool = False, act_name: str = "", filename: str = "") -> bool:
    """Download PDF using requests library (better redirect handling)"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.indiacode.nic.in/',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    }
    
    # Create a session to maintain cookies (helps with redirects)
    session = requests.Session()
    session.headers.update(headers)
    
    for attempt in range(max_retries):
        try:
            # Create parent directory if it doesn't exist
            filepath.parent.mkdir(parents=True, exist_ok=True)
            
            print(f"  Downloading: {url[:80]}...")
            
            # Use session with allow_redirects=True (don't use stream for now to avoid issues)
            response = session.get(
                url, 
                timeout=30, 
                allow_redirects=True,
                stream=False,  # Don't stream to avoid content access issues
                verify=True
            )
            
            # Check status
            if response.status_code not in [200]:
                print(f"  ✗ HTTP Error {response.status_code}: {response.reason}")
                # Check if it's a redirect that wasn't followed
                if response.status_code in [301, 302, 303, 307, 308]:
                    redirect_url = response.headers.get('Location') or response.url
                    if redirect_url and redirect_url != url:
                        print(f"  Found redirect to: {redirect_url[:60]}...")
                        # Try following the redirect manually
                        redirect_response = session.get(redirect_url, timeout=30, allow_redirects=True, stream=False)
                        if redirect_response.status_code == 200:
                            response = redirect_response
                        else:
                            if attempt < max_retries - 1:
                                print(f"    Retrying in 3 seconds... (attempt {attempt + 1}/{max_retries})")
                                time.sleep(3)
                                continue
                            else:
                                if search_alternatives and act_name:
                                    return try_alternative_urls(act_name, filename, filepath, "")
                                return False
                    else:
                        if attempt < max_retries - 1:
                            print(f"    Retrying in 3 seconds... (attempt {attempt + 1}/{max_retries})")
                            time.sleep(3)
                            continue
                        else:
                            if search_alternatives and act_name:
                                return try_alternative_urls(act_name, filename, filepath, "")
                            return False
                else:
                    if attempt < max_retries - 1:
                        print(f"    Retrying in 3 seconds... (attempt {attempt + 1}/{max_retries})")
                        time.sleep(3)
                        continue
                    else:
                        if search_alternatives and act_name:
                            return try_alternative_urls(act_name, filename, filepath, "")
                        return False
            
            # If we got redirected, the final URL should be in response.url
            if response.url != url:
                print(f"  Followed redirect to: {response.url[:60]}...")
            
            # Check content type
            content_type = response.headers.get('Content-Type', '').lower()
            
            # If HTML response, might be a redirect page
            if 'html' in content_type and response.status_code == 200:
                if HAS_BS4:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    # Look for meta refresh redirects
                    for meta in soup.find_all('meta', attrs={'http-equiv': re.compile('refresh', re.I)}):
                        content = meta.get('content', '')
                        if 'url=' in content.lower():
                            redirect_url = content.split('url=')[1].strip()
                            if redirect_url.startswith('http'):
                                print(f"  Found meta redirect: {redirect_url[:60]}...")
                                return download_pdf_with_requests(redirect_url, filepath, max_retries=1, search_alternatives=False)
                            else:
                                redirect_url = urllib.parse.urljoin(response.url, redirect_url)
                                print(f"  Found meta redirect: {redirect_url[:60]}...")
                                return download_pdf_with_requests(redirect_url, filepath, max_retries=1, search_alternatives=False)
                    # Look for direct PDF links in the page
                    for link in soup.find_all('a', href=True):
                        href = link.get('href', '')
                        if href.endswith('.pdf') or '/pdf' in href.lower():
                            if not href.startswith('http'):
                                href = urllib.parse.urljoin(response.url, href)
                            print(f"  Found PDF link in page: {href[:60]}...")
                            return download_pdf_with_requests(href, filepath, max_retries=1, search_alternatives=False)
            
            # Check if it's a PDF
            if not response.content:
                print(f"  ✗ Empty response")
                if search_alternatives and act_name:
                    return try_alternative_urls(act_name, filename, filepath, "")
                return False
            
            first_bytes = response.content[:4]
            if first_bytes != b'%PDF':
                print(f"  ✗ Not a PDF file (first bytes: {first_bytes}, Content-Type: {content_type})")
                # If it's HTML, might be a redirect page - try web search
                if 'html' in content_type and search_alternatives and act_name:
                    return try_alternative_urls(act_name, filename, filepath, "")
                return False
            
            # Download the file
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            # Verify file
            if filepath.exists() and filepath.stat().st_size > 0:
                size_kb = filepath.stat().st_size / 1024
                print(f"  ✓ Downloaded: {filepath.name} ({size_kb:.1f} KB)")
                return True
            else:
                print(f"  ✗ Download failed: File is empty")
                if filepath.exists():
                    filepath.unlink()
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"  ✗ Request Error: {str(e)}")
            if attempt < max_retries - 1:
                print(f"    Retrying in 3 seconds... (attempt {attempt + 1}/{max_retries})")
                time.sleep(3)
            else:
                if search_alternatives and act_name:
                    return try_alternative_urls(act_name, filename, filepath, "")
                return False
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            if attempt < max_retries - 1:
                print(f"    Retrying in 3 seconds... (attempt {attempt + 1}/{max_retries})")
                time.sleep(3)
            else:
                if search_alternatives and act_name:
                    return try_alternative_urls(act_name, filename, filepath, "")
                return False
    
    return False


def download_pdf_with_urllib(url: str, filepath: Path, max_retries: int = 3, search_alternatives: bool = False, act_name: str = "", filename: str = "") -> bool:
    """Download PDF using urllib (fallback)"""
    for attempt in range(max_retries):
        try:
            # Create parent directory if it doesn't exist
            filepath.parent.mkdir(parents=True, exist_ok=True)
            
            print(f"  Downloading: {url[:80]}...")
            
            # Create an opener that follows redirects automatically
            opener = urllib.request.build_opener(urllib.request.HTTPRedirectHandler())
            opener.addheaders = [
                ('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'),
                ('Accept', 'application/pdf,application/octet-stream,*/*'),
                ('Accept-Language', 'en-US,en;q=0.9'),
                ('Referer', 'https://www.indiacode.nic.in/')
            ]
            
            # Open URL directly (opener will handle redirects)
            with opener.open(url, timeout=30) as response:
                # Check if it's actually a PDF by reading first bytes
                first_bytes = response.read(4)
                if first_bytes != b'%PDF':
                    print(f"  ✗ Not a PDF file (first bytes: {first_bytes})")
                    return False
                
                # Download the file (write first 4 bytes we already read)
                with open(filepath, 'wb') as f:
                    f.write(first_bytes)
                    while True:
                        chunk = response.read(8192)
                        if not chunk:
                            break
                        f.write(chunk)
            
            # Verify file was downloaded and is not empty
            if filepath.exists() and filepath.stat().st_size > 0:
                # Verify it's actually a PDF
                with open(filepath, 'rb') as f:
                    first_bytes = f.read(4)
                    if first_bytes != b'%PDF':
                        print(f"  ✗ Downloaded file is not a valid PDF")
                        filepath.unlink()
                        return False
                
                size_kb = filepath.stat().st_size / 1024
                print(f"  ✓ Downloaded: {filepath.name} ({size_kb:.1f} KB)")
                return True
            else:
                print(f"  ✗ Download failed: File is empty")
                if filepath.exists():
                    filepath.unlink()
                return False
                
        except urllib.error.HTTPError as e:
            print(f"  ✗ HTTP Error {e.code}: {e.reason}")
            if attempt < max_retries - 1:
                print(f"    Retrying in 3 seconds... (attempt {attempt + 1}/{max_retries})")
                time.sleep(3)
            else:
                if search_alternatives and act_name:
                    return try_alternative_urls(act_name, filename, filepath, "")
                return False
        except urllib.error.URLError as e:
            print(f"  ✗ URL Error: {e.reason}")
            if attempt < max_retries - 1:
                print(f"    Retrying in 3 seconds... (attempt {attempt + 1}/{max_retries})")
                time.sleep(3)
            else:
                if search_alternatives and act_name:
                    return try_alternative_urls(act_name, filename, filepath, "")
                return False
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            if attempt < max_retries - 1:
                print(f"    Retrying in 3 seconds... (attempt {attempt + 1}/{max_retries})")
                time.sleep(3)
            else:
                if search_alternatives and act_name:
                    return try_alternative_urls(act_name, filename, filepath, "")
                return False
    
    return False


def main():
    """Main function to download PDFs from CSV"""
    script_dir = Path(__file__).parent
    csv_file = script_dir / "pdf.csv"
    base_download_dir = script_dir / "pdfs"
    
    if not csv_file.exists():
        print(f"ERROR: CSV file not found: {csv_file}")
        return
    
    print("=" * 60)
    print("PDF Downloader")
    print("=" * 60)
    print(f"CSV File: {csv_file}")
    print(f"Download Directory: {base_download_dir}")
    print("=" * 60 + "\n")
    
    # Create base download directory
    base_download_dir.mkdir(exist_ok=True)
    
    # Read CSV and download PDFs
    current_category = None
    downloaded_count = 0
    skipped_count = 0
    error_count = 0
    failed_downloads = []  # Track failed downloads
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        # Use csv.reader with proper quoting to handle multi-line entries
        reader = csv.reader(f)
        header = next(reader)  # Skip header
        
        # Find column indices
        try:
            category_idx = header.index('Category')
            subcategory_idx = header.index('Sub Category')
            dataset_link_idx = header.index('Dataset Link ')
            status_idx = header.index('Status ') if 'Status ' in header else -1
        except ValueError as e:
            print(f"ERROR: Could not find required column in CSV: {e}")
            print(f"Available columns: {header}")
            return
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
            # Handle rows with fewer columns
            while len(row) <= max(category_idx, subcategory_idx, dataset_link_idx):
                row.append('')
            
            category = row[category_idx].strip() if category_idx < len(row) else ''
            subcategory = row[subcategory_idx].strip() if subcategory_idx < len(row) else ''
            dataset_link = row[dataset_link_idx].strip() if dataset_link_idx < len(row) else ''
            status = row[status_idx].strip() if status_idx >= 0 and status_idx < len(row) else ''
            
            # Clean up dataset_link - remove newlines and extra whitespace
            dataset_link = ' '.join(dataset_link.split())
            
            # Update current category if provided
            if category:
                current_category = category
            
            # Skip if no URL
            if not dataset_link:
                skipped_count += 1
                continue
            
            # Skip if already downloaded (status check)
            if status and status.lower() in ['downloaded', 'done', 'complete']:
                print(f"Row {row_num}: Skipping (already downloaded): {dataset_link[:60]}...")
                skipped_count += 1
                continue
            
            # Create folder structure
            if current_category:
                category_dir = base_download_dir / sanitize_filename(current_category)
                if subcategory:
                    subcategory_dir = category_dir / sanitize_filename(subcategory)
                    download_dir = subcategory_dir
                else:
                    download_dir = category_dir
            else:
                download_dir = base_download_dir / "uncategorized"
            
            # Get filename
            filename = get_filename_from_url(dataset_link, current_category or "", subcategory)
            if not filename:
                print(f"Row {row_num}: Skipping (no valid filename)")
                skipped_count += 1
                continue
            
            # Ensure .pdf extension
            if not filename.endswith('.pdf'):
                filename += '.pdf'
            
            filepath = download_dir / filename
            
            # Skip if file already exists
            if filepath.exists():
                print(f"Row {row_num}: File already exists: {filepath.relative_to(script_dir)}")
                skipped_count += 1
                continue
            
            # Download PDF
            print(f"\nRow {row_num}: {current_category or 'Uncategorized'}")
            if subcategory:
                print(f"  Subcategory: {subcategory}")
            print(f"  URL: {dataset_link[:80]}...")
            
            # Try direct download first
            act_name = subcategory if subcategory else (current_category or 'Uncategorized')
            if download_pdf(dataset_link, filepath, search_alternatives=False):
                downloaded_count += 1
            else:
                # If direct download fails, try web scraping/search
                print(f"  Direct download failed. Starting web search...")
                if try_alternative_urls(act_name, filename, filepath, current_category or ""):
                    downloaded_count += 1
                    print(f"  ✓ Successfully downloaded from web search!")
                else:
                    error_count += 1
                    print(f"  ✗ All attempts failed")
                    # Track failed download
                    failed_downloads.append({
                        'row': row_num,
                        'category': current_category or 'Uncategorized',
                        'subcategory': subcategory or '',
                        'url': dataset_link,
                        'filename': filename
                    })
            
            # Small delay to be respectful to servers
            time.sleep(0.5)
    
    # Summary
    print("\n" + "=" * 60)
    print("DOWNLOAD SUMMARY")
    print("=" * 60)
    print(f"Downloaded: {downloaded_count}")
    print(f"Skipped: {skipped_count}")
    print(f"Errors: {error_count}")
    print(f"Total: {downloaded_count + skipped_count + error_count}")
    print("=" * 60)
    
    # List failed downloads
    if failed_downloads:
        print("\n" + "=" * 60)
        print("FAILED DOWNLOADS")
        print("=" * 60)
        print(f"Total failed: {len(failed_downloads)}\n")
        
        for i, failed in enumerate(failed_downloads, 1):
            print(f"{i}. Row {failed['row']}: {failed['category']}")
            if failed['subcategory']:
                print(f"   Subcategory: {failed['subcategory']}")
            print(f"   Filename: {failed['filename']}")
            print(f"   URL: {failed['url']}")
            print()
        
        print("=" * 60)
        
        # Also save to a text file
        failed_file = script_dir / "failed_downloads.txt"
        with open(failed_file, 'w', encoding='utf-8') as f:
            f.write("FAILED DOWNLOADS LIST\n")
            f.write("=" * 60 + "\n")
            f.write(f"Total failed: {len(failed_downloads)}\n\n")
            
            for i, failed in enumerate(failed_downloads, 1):
                f.write(f"{i}. Row {failed['row']}: {failed['category']}\n")
                if failed['subcategory']:
                    f.write(f"   Subcategory: {failed['subcategory']}\n")
                f.write(f"   Filename: {failed['filename']}\n")
                f.write(f"   URL: {failed['url']}\n\n")
        
        print(f"\nFailed downloads list saved to: {failed_file.relative_to(script_dir)}")
    else:
        print("\n✓ All downloads completed successfully!")


def retry_failed_downloads():
    """Retry downloading failed PDFs from failed_downloads.txt"""
    script_dir = Path(__file__).parent
    failed_file = script_dir / "failed_downloads.txt"
    base_download_dir = script_dir / "pdfs"
    
    if not failed_file.exists():
        print(f"ERROR: failed_downloads.txt not found: {failed_file}")
        return
    
    print("=" * 60)
    print("RETRYING FAILED DOWNLOADS")
    print("=" * 60)
    
    # Parse failed downloads
    failed_downloads = []
    current_item = {}
    
    with open(failed_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for line in lines:
        line = line.strip()
        
        # Skip header lines and empty lines
        if not line or line.startswith('=') or 'FAILED DOWNLOADS' in line or 'Total failed' in line:
            # Save current item if we hit a blank line and have data
            if current_item and current_item.get('url'):
                failed_downloads.append(current_item)
                current_item = {}
            continue
        
        # Check if this is a numbered entry (e.g., "1. Row 8: ...")
        if re.match(r'^\d+\.\s+Row', line):
            # Save previous item if exists
            if current_item and current_item.get('url'):
                failed_downloads.append(current_item)
            
            # Start new item
            current_item = {}
            match = re.search(r'Row (\d+):\s*(.+)', line)
            if match:
                current_item['row'] = int(match.group(1))
                current_item['category'] = match.group(2).strip()
        
        # Parse subcategory (with or without leading spaces)
        elif 'Subcategory:' in line:
            parts = line.split('Subcategory:', 1)
            if len(parts) > 1:
                current_item['subcategory'] = parts[1].strip()
        
        # Parse filename (with or without leading spaces)
        elif 'Filename:' in line:
            parts = line.split('Filename:', 1)
            if len(parts) > 1:
                current_item['filename'] = parts[1].strip()
        
        # Parse URL (with or without leading spaces)
        elif 'URL:' in line:
            parts = line.split('URL:', 1)
            if len(parts) > 1:
                current_item['url'] = parts[1].strip()
    
    # Add last item
    if current_item and current_item.get('url'):
        failed_downloads.append(current_item)
    
    print(f"Found {len(failed_downloads)} failed downloads to retry\n")
    
    if len(failed_downloads) == 0:
        print("No failed downloads found to retry. Checking file format...")
        with open(failed_file, 'r', encoding='utf-8') as f:
            sample = f.read(500)
            print("First 500 chars of file:")
            print(sample)
        return
    
    downloaded_count = 0
    still_failed = []
    
    print(f"Processing {len(failed_downloads)} items...\n")
    
    for idx, item in enumerate(failed_downloads, 1):
        category = item.get('category', 'Uncategorized')
        subcategory = item.get('subcategory', '')
        url = item.get('url', '').strip()
        filename = item.get('filename', '').strip()
        
        if not url:
            print(f"\n[{idx}/{len(failed_downloads)}] ⚠ Skipping: No URL found")
            print(f"  Item: {item}")
            still_failed.append(item)
            continue
        
        # Create folder structure
        if category and category != 'Uncategorized':
            category_dir = base_download_dir / sanitize_filename(category)
            if subcategory:
                subcategory_dir = category_dir / sanitize_filename(subcategory)
                download_dir = subcategory_dir
            else:
                download_dir = category_dir
        else:
            download_dir = base_download_dir / "uncategorized"
        
        # Ensure .pdf extension
        if filename and not filename.endswith('.pdf'):
            filename += '.pdf'
        
        if not filename:
            filename = get_filename_from_url(url, category, subcategory)
            if not filename.endswith('.pdf'):
                filename += '.pdf'
        
        filepath = download_dir / filename
        
        # Skip if already exists
        if filepath.exists():
            print(f"✓ Already exists: {filepath.relative_to(script_dir)}")
            downloaded_count += 1
            continue
        
        print(f"\n[{idx}/{len(failed_downloads)}] Retrying: {category}")
        if subcategory:
            print(f"  Subcategory: {subcategory}")
        print(f"  Filename: {filename}")
        print(f"  Original URL: {url[:80]}...")
        
        # Use subcategory or category as act_name for search
        act_name = subcategory if subcategory else category
        
        # First try direct download (with redirect handling) - only 1 retry to fail fast
        print(f"  [DIRECT] Attempting direct download...")
        if download_pdf(url, filepath, max_retries=1, search_alternatives=False, act_name=act_name, filename=filename):
            downloaded_count += 1
            print(f"  [DIRECT] ✓ Successfully downloaded!")
        else:
            # If direct download fails, immediately try web scraping/search
            print(f"  [DIRECT] ✗ Direct download failed. Starting web search...")
            if try_alternative_urls(act_name, filename, filepath, category):
                downloaded_count += 1
                print(f"  [WEB] ✓ Successfully downloaded from web search!")
            else:
                still_failed.append(item)
                print(f"  [FINAL] ✗ All attempts failed")
        
        time.sleep(1)  # Small delay between downloads
    
    print("\n" + "=" * 60)
    print("RETRY SUMMARY")
    print("=" * 60)
    print(f"Successfully downloaded: {downloaded_count}")
    print(f"Still failed: {len(still_failed)}")
    print("=" * 60)
    
    # Update failed_downloads.txt if there are still failures
    if still_failed:
        with open(failed_file, 'w', encoding='utf-8') as f:
            f.write("FAILED DOWNLOADS LIST\n")
            f.write("=" * 60 + "\n")
            f.write(f"Total failed: {len(still_failed)}\n\n")
            
            for i, failed in enumerate(still_failed, 1):
                f.write(f"{i}. Row {failed.get('row', '?')}: {failed.get('category', 'Unknown')}\n")
                if failed.get('subcategory'):
                    f.write(f"   Subcategory: {failed.get('subcategory')}\n")
                f.write(f"   Filename: {failed.get('filename', 'unknown')}\n")
                f.write(f"   URL: {failed.get('url', '')}\n\n")
        
        print(f"\nUpdated failed_downloads.txt with {len(still_failed)} remaining failures")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--retry':
        retry_failed_downloads()
    else:
        main()
