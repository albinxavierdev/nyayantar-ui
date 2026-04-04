"""
Web Search Module for ASK Agent
Provides DuckDuckGo web and news search integration for legal research
"""
import os
import time
from typing import List, Dict, Optional, Tuple
from pathlib import Path

try:
    from duckduckgo_search import DDGS
    HAS_DUCKDUCKGO = True
except ImportError:
    HAS_DUCKDUCKGO = False
    print("⚠ duckduckgo-search not installed. Install with: pip install duckduckgo-search")

# Configuration
WEB_SEARCH_MAX_RESULTS = 5
NEWS_SEARCH_MAX_RESULTS = 5
SEARCH_TIMEOUT = 10  # seconds

# Legal news sources priority
LEGAL_NEWS_SOURCES = [
    "livelaw.in",
    "barandbench.com",
    "legallyindia.com",
    "lawctopus.com",
    "thehindu.com",
    "indiatimes.com",
    "livemint.com"
]

# Legal web domains priority (for ranking)
LEGAL_WEB_DOMAINS = {
    "indiankanoon.org": 10,
    "indiacode.nic.in": 10,
    "lawcommissionofindia.nic.in": 9,
    "supremecourtofindia.nic.in": 9,
    "gov.in": 8,
    "nic.in": 8,
    "livelaw.in": 7,
    "barandbench.com": 7
}


def classify_query_type(query: str, entities: List[Dict] = None, bioes_tags: List[Dict] = None) -> Dict:
    """
    Classify query to determine search strategy (web, news, or both)
    DEFAULT: Returns "both" for comprehensive search (web + news)
    Uses BIOES tags and entities to enhance search if detected
    
    Args:
        query: User's query
        entities: Detected entities from NER
        bioes_tags: BIOES tags from tagging phase
    
    Returns:
        Dict with needs_web, needs_news, and search_type
    """
    # DEFAULT: Search both web and news for comprehensive results
    needs_news = True
    needs_web = True
    
    # Analyze entities for temporal/recent information
    if entities:
        for ent in entities:
            if isinstance(ent, dict):
                label = ent.get("label", "")
                text = ent.get("text", "").lower()
            else:
                label = getattr(ent, "label", "")
                text = getattr(ent, "text", "").lower()
            
            # Check for DATE entities with recent years
            if label == "DATE":
                # Check if date contains recent years
                if any(year in text for year in ["2024", "2025", "2023"]):
                    needs_news = True
            
            # Check for CASE/JUDGMENT entities - might need news for recent cases
            if label in ["CASE", "JUDGMENT", "COURT"]:
                # If query asks about cases/judgments, likely needs news
                needs_news = True
    
    # Analyze BIOES tags for temporal indicators
    if bioes_tags:
        temporal_indicators = []
        temporal_entity_types = ["DATE", "TIME"]
        
        for tag_info in bioes_tags:
            token = tag_info.get("token", "").lower()
            tag = tag_info.get("tag", "")
            entity_type = tag_info.get("entity_type", "")
            
            # Check if tag indicates a temporal entity
            if entity_type in temporal_entity_types:
                needs_news = True
            
            # Check for temporal words in tokens (not just entities)
            temporal_words = [
                "latest", "recent", "new", "today", "current", "this week",
                "this month", "this year", "recently", "just", "now"
            ]
            if token in temporal_words:
                needs_news = True
            
            # Check for news-related entity types
            if entity_type in ["NEWS", "EVENT", "UPDATE"]:
                needs_news = True
    
    # DEFAULT: Always search both web and news for comprehensive results
    # This ensures we get both legal documents and recent updates
    search_type = "both"
    
    return {
        "needs_web": needs_web,
        "needs_news": needs_news,
        "search_type": search_type
    }


def build_legal_query(query: str, entities: List[Dict] = None, bioes_tags: List[Dict] = None) -> str:
    """
    Enhance query for legal web search accuracy - ALWAYS includes India legal context
    
    Args:
        query: Original query
        entities: Detected entities
        bioes_tags: BIOES tags
    
    Returns:
        Enhanced query string with India legal context
    """
    enhanced = query
    
    # ALWAYS add "India" and "legal" to ensure Indian legal sources
    # This prevents results from other countries
    if "india" not in query.lower() and "indian" not in query.lower():
        enhanced = f"{query} India"
    
    # ALWAYS add legal context to ensure legal sources
    legal_keywords = ["legal", "law", "act", "section", "statute", "judgment", "court"]
    if not any(kw in query.lower() for kw in legal_keywords):
        enhanced += " legal"
    
    # Add "Indian law" or "India legal" to make it more specific
    if "indian law" not in enhanced.lower() and "india legal" not in enhanced.lower():
        enhanced += " Indian law"
    
    # Add detected entities (statutes, acts, sections, cases, judgments)
    if entities:
        entity_texts = []
        for ent in entities:
            if isinstance(ent, dict):
                label = ent.get("label", "")
                text = ent.get("text", "")
            else:
                label = getattr(ent, "label", "")
                text = getattr(ent, "text", "")
            
            # Include relevant legal entities
            if label in ["STATUTE", "ACT", "SECTION", "CASE", "JUDGMENT", "COURT"] and text:
                entity_texts.append(text)
        
        if entity_texts:
            enhanced += " " + " ".join(entity_texts[:3])
    
    # Use BIOES tags to extract additional context
    if bioes_tags:
        # Extract tokens that are part of legal entities
        legal_tokens = []
        for tag_info in bioes_tags:
            tag = tag_info.get("tag", "")
            token = tag_info.get("token", "")
            entity_type = tag_info.get("entity_type", "")
            
            # If token is part of a legal entity (not O tag)
            if tag != "O" and entity_type in ["STATUTE", "ACT", "SECTION", "CASE", "JUDGMENT"]:
                if token not in enhanced:  # Avoid duplicates
                    legal_tokens.append(token)
        
        if legal_tokens:
            enhanced += " " + " ".join(legal_tokens[:2])
    
    return enhanced.strip()


def build_legal_news_query(query: str, entities: List[Dict] = None, bioes_tags: List[Dict] = None) -> str:
    """
    Enhance query for legal news search - ALWAYS includes India legal news context
    
    Args:
        query: Original query
        entities: Detected entities
        bioes_tags: BIOES tags
    
    Returns:
        Enhanced query string with India legal news context
    """
    enhanced = query
    
    # ALWAYS add "India" to ensure Indian news sources
    if "india" not in query.lower() and "indian" not in query.lower():
        enhanced = f"{query} India"
    
    # ALWAYS add legal news context
    news_keywords = ["legal news", "judgment", "court", "law"]
    if not any(kw in query.lower() for kw in news_keywords):
        enhanced += " legal news"
    
    # Add "Indian legal news" to make it more specific
    if "indian legal" not in enhanced.lower():
        enhanced += " Indian legal"
    
    # Add entities (especially cases, judgments, courts)
    if entities:
        entity_texts = []
        for ent in entities:
            if isinstance(ent, dict):
                label = ent.get("label", "")
                text = ent.get("text", "")
            else:
                label = getattr(ent, "label", "")
                text = getattr(ent, "text", "")
            
            # Prioritize case/judgment entities for news search
            if label in ["CASE", "JUDGMENT", "COURT", "STATUTE", "ACT"] and text:
                entity_texts.append(text)
        
        if entity_texts:
            enhanced += " " + " ".join(entity_texts[:3])
    
    # Use BIOES tags to extract temporal and case-related context
    if bioes_tags:
        case_tokens = []
        temporal_tokens = []
        
        for tag_info in bioes_tags:
            tag = tag_info.get("tag", "")
            token = tag_info.get("token", "")
            entity_type = tag_info.get("entity_type", "")
            
            # Extract case/judgment related tokens
            if tag != "O" and entity_type in ["CASE", "JUDGMENT", "COURT"]:
                if token not in enhanced:
                    case_tokens.append(token)
            
            # Extract temporal tokens (dates, time references)
            if entity_type in ["DATE", "TIME"] or "DATE" in tag:
                if token not in enhanced:
                    temporal_tokens.append(token)
        
        if case_tokens:
            enhanced += " " + " ".join(case_tokens[:2])
        if temporal_tokens:
            enhanced += " " + " ".join(temporal_tokens[:2])
    
    return enhanced.strip()


def rank_and_filter_web_results(results: List[Dict], max_results: int) -> List[Dict]:
    """
    Rank web results by source authority and relevance
    FILTERS OUT non-Indian sources and prioritizes Indian legal domains
    
    Args:
        results: List of search results
        max_results: Maximum number of results to return
    
    Returns:
        Ranked and filtered results (only Indian legal sources)
    """
    if not results:
        return []
    
    scored_results = []
    
    # Domains to exclude (non-Indian or non-legal)
    # Build dynamically based on common non-Indian TLDs
    exclude_domains = [
        ".cn", ".hk", ".sg", "scmp.com", "zhihu.com",  # Chinese/Hong Kong/Singapore
        ".com.au", ".co.uk", ".com",  # But allow .com if it's Indian legal
        ".jp", ".kr", ".tw", ".th", ".my", ".ph",  # Other Asian countries
        ".us", ".ca", ".uk", ".au", ".nz",  # Western countries
    ]
    
    # Indian indicators
    indian_indicators = [
        ".in", ".gov.in", ".nic.in", "indian", "india",
        "indiankanoon", "livelaw", "barandbench", "supremecourt"
    ]
    
    for result in results:
        url = result.get("href", "").lower()
        body = result.get("body", "").lower()
        title = result.get("title", "").lower()
        
        # FILTER: Exclude non-Indian domains
        is_excluded = False
        for exclude_domain in exclude_domains:
            if exclude_domain in url and not any(indicator in url for indicator in [".in", "indiankanoon", "livelaw", "barandbench"]):
                is_excluded = True
                break
        
        if is_excluded:
            continue  # Skip non-Indian sources
        
        # Must have Indian indicator or be from known Indian legal domain
        has_indian_indicator = any(indicator in url or indicator in title or indicator in body for indicator in indian_indicators)
        
        # If no Indian indicator, skip (unless it's a known Indian legal domain)
        if not has_indian_indicator:
            # Check if it's from a known Indian legal domain
            is_indian_legal_domain = any(domain in url for domain in LEGAL_WEB_DOMAINS.keys())
            if not is_indian_legal_domain:
                continue  # Skip non-Indian sources
        
        score = 0
        
        # Check domain authority (Indian legal domains get high scores)
        for domain, authority_score in LEGAL_WEB_DOMAINS.items():
            if domain in url:
                score += authority_score
                break
        
        # High boost for Indian government domains
        if ".gov.in" in url or ".nic.in" in url:
            score += 5
        
        # Boost for .in domains
        if ".in" in url and score == 0:
            score += 3
        
        # Boost if contains Indian legal citations
        indian_legal_keywords = ["section", "act", "ipc", "bns", "case", "judgment", "supreme court", "high court"]
        if any(cite in body or cite in title for cite in indian_legal_keywords):
            score += 3
        
        # Boost if explicitly mentions India/Indian
        if "india" in body or "indian" in body or "india" in title or "indian" in title:
            score += 2
        
        # Dynamic recency scoring based on current year
        from datetime import datetime
        current_year = datetime.now().year
        previous_year = current_year - 1
        
        # Extract years from content dynamically
        import re
        years_in_content = re.findall(r'\b(19|20)\d{2}\b', body + " " + title)
        years_in_content = [int(y) for y in years_in_content if y.isdigit()]
        
        if years_in_content:
            max_year = max(years_in_content)
            # Boost for recent content (current year or previous year)
            if max_year >= previous_year:
                score += 3
            # Penalize very old content (more than 5 years old)
            elif max_year < (current_year - 5):
                score -= 5  # Heavy penalty for old content
        
        scored_results.append((score, result))
    
    # Sort by score (descending) and return top results
    scored_results.sort(key=lambda x: x[0], reverse=True)
    
    # Only return results with score > 0 (meaning they passed Indian filtering)
    filtered = [result for score, result in scored_results if score > 0]
    
    return filtered[:max_results]


def filter_legal_news(news_results: List[Dict], max_results: int) -> List[Dict]:
    """
    Filter and rank news results for Indian legal relevance
    FILTERS OUT non-Indian sources
    
    Args:
        news_results: List of news search results
        max_results: Maximum number of results to return
    
    Returns:
        Filtered and ranked news results (only Indian legal sources)
    """
    if not news_results:
        return []
    
    filtered = []
    
    # Domains to exclude (non-Indian)
    # Build dynamically based on common non-Indian TLDs
    exclude_domains = [
        ".cn", ".hk", ".sg", "scmp.com", "zhihu.com",
        ".com.au", ".co.uk", ".jp", ".kr", ".tw", ".th", ".my", ".ph",
        ".us", ".ca", ".uk", ".au", ".nz"
    ]
    
    # Indian indicators
    indian_indicators = [
        ".in", ".gov.in", ".nic.in", "indian", "india",
        "indiankanoon", "livelaw", "barandbench", "supremecourt", "devdiscourse"
    ]
    
    for result in news_results:
        url = result.get("url", "").lower()
        title = result.get("title", "").lower()
        body = result.get("body", "").lower()
        
        # FILTER: Exclude non-Indian domains
        is_excluded = False
        for exclude_domain in exclude_domains:
            if exclude_domain in url and not any(indicator in url for indicator in [".in", "indiankanoon", "livelaw", "barandbench", "devdiscourse"]):
                is_excluded = True
                break
        
        if is_excluded:
            continue  # Skip non-Indian sources
        
        # Must have Indian indicator
        has_indian_indicator = any(indicator in url or indicator in title or indicator in body for indicator in indian_indicators)
        
        # Check if from Indian legal news source
        is_legal_source = any(source in url for source in LEGAL_NEWS_SOURCES)
        
        # If no Indian indicator and not from known Indian legal source, skip
        if not has_indian_indicator and not is_legal_source:
            continue  # Skip non-Indian sources
        
        # Check if content is legal-related
        legal_keywords = [
            "law", "legal", "court", "judgment", "judge", "lawyer",
            "act", "section", "ipc", "bns", "criminal", "civil",
            "supreme court", "high court", "judiciary", "statute"
        ]
        has_legal_content = any(kw in title or kw in body for kw in legal_keywords)
        
        # Only include if it's from Indian legal source OR has Indian + legal content
        if is_legal_source or (has_indian_indicator and has_legal_content):
            # Add recency score (prefer recent news)
            date = result.get("date", "")
            date_lower = date.lower()
            body_date = body
            title_date = title
            
            # Dynamic recency scoring based on current year
            from datetime import datetime
            import re
            
            current_year = datetime.now().year
            previous_year = current_year - 1
            
            # Extract years from date field and content
            all_text = date_lower + " " + body_date + " " + title_date
            years_found = re.findall(r'\b(19|20)\d{2}\b', all_text)
            years_found = [int(y) for y in years_found if y.isdigit() and len(y) == 4]
            
            recency_score = 1.0
            if years_found:
                max_year = max(years_found)
                # Boost for recent years (current year or previous year)
                if max_year >= previous_year:
                    recency_score = 3.0
                elif max_year >= (current_year - 2):
                    recency_score = 2.0
                elif max_year >= (current_year - 3):
                    recency_score = 1.5
                elif max_year >= (current_year - 4):
                    recency_score = 1.2
                # Penalize very old content (more than 5 years old)
                elif max_year < (current_year - 5):
                    recency_score = 0.3  # Heavy penalty for old content
            
            # Boost Indian legal sources
            relevance_score = (3.0 if is_legal_source else 1.5 if has_indian_indicator else 1.0) * recency_score
            
            result["relevance_score"] = relevance_score
            filtered.append(result)
    
    # Sort by relevance score
    filtered.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    return filtered[:max_results]


def search_legal_web(query: str, entities: List[Dict] = None, bioes_tags: List[Dict] = None, max_results: int = None) -> List[Dict]:
    """
    Search web for legal documents, case law, statutes
    
    Args:
        query: Search query
        entities: Detected entities
        max_results: Maximum results to return
    
    Returns:
        List of search results
    """
    if not HAS_DUCKDUCKGO:
        print("[Web Search] ⚠ DuckDuckGo not available")
        return []
    
    if max_results is None:
        max_results = WEB_SEARCH_MAX_RESULTS
    
    search_start = time.time()
    
    try:
        print(f"[Web Search] Searching legal documents and case law...")
        print(f"[Web Search] Query: {query}")
        
        # Build enhanced query using entities and BIOES tags
        enhanced_query = build_legal_query(query, entities, bioes_tags)
        print(f"[Web Search] Enhanced query: {enhanced_query}")
        
        results = []
        
        with DDGS() as ddgs:
            # Search with enhanced query
            try:
                search_results = list(ddgs.text(
                    enhanced_query,
                    max_results=max_results * 2,  # Get more to filter
                    safesearch='moderate'
                ))
                results.extend(search_results)
            except Exception as e:
                print(f"[Web Search] ⚠ Error in web search: {e}")
                return []
        
        # Rank and filter results
        ranked_results = rank_and_filter_web_results(results, max_results)
        
        search_time = time.time() - search_start
        print(f"[Web Search] ✓ Found {len(ranked_results)} relevant web results in {search_time:.3f}s")
        
        return ranked_results
        
    except Exception as e:
        search_time = time.time() - search_start
        print(f"[Web Search] ✗ Error searching web: {e}")
        print(f"[Web Search] Search time: {search_time:.3f}s")
        return []


def search_legal_news(query: str, entities: List[Dict] = None, bioes_tags: List[Dict] = None, max_results: int = None) -> List[Dict]:
    """
    Search news for recent legal updates, judgments, amendments
    
    Args:
        query: Search query
        entities: Detected entities
        max_results: Maximum results to return
    
    Returns:
        List of news search results
    """
    if not HAS_DUCKDUCKGO:
        print("[News Search] ⚠ DuckDuckGo not available")
        return []
    
    if max_results is None:
        max_results = NEWS_SEARCH_MAX_RESULTS
    
    search_start = time.time()
    
    try:
        print(f"[News Search] Searching recent legal news and updates...")
        print(f"[News Search] Query: {query}")
        
        # Build enhanced query using entities and BIOES tags
        enhanced_query = build_legal_news_query(query, entities, bioes_tags)
        print(f"[News Search] Enhanced query: {enhanced_query}")
        
        with DDGS() as ddgs:
            # Search news
            # Get more results to filter aggressively for Indian sources
            try:
                news_results = list(ddgs.news(
                    enhanced_query,
                    max_results=max_results * 4,  # Get many more to filter aggressively
                    safesearch='moderate'
                ))
            except Exception as e:
                print(f"[News Search] ⚠ Error in news search: {e}")
                return []
        
        # Filter for legal relevance
        filtered_results = filter_legal_news(news_results, max_results)
        
        search_time = time.time() - search_start
        print(f"[News Search] ✓ Found {len(filtered_results)} relevant news results in {search_time:.3f}s")
        
        return filtered_results
        
    except Exception as e:
        search_time = time.time() - search_start
        print(f"[News Search] ✗ Error searching news: {e}")
        print(f"[News Search] Search time: {search_time:.3f}s")
        return []


def search_web_and_news(
    query: str,
    entities: List[Dict] = None,
    bioes_tags: List[Dict] = None,
    search_type: str = "both"
) -> Dict:
    """
    Perform web and/or news search based on query type
    
    Args:
        query: User's query
        entities: Detected entities
        bioes_tags: BIOES tags from tagging phase
        search_type: "web", "news", or "both"
    
    Returns:
        Dict with web_results, news_results, combined_context, sources, and timing
    """
    search_start = time.time()
    
    results = {
        "web_results": [],
        "news_results": [],
        "combined_context": "",
        "sources": [],
        "search_time_seconds": 0
    }
    
    if search_type in ["web", "both"]:
        web_results = search_legal_web(query, entities, bioes_tags)
        results["web_results"] = web_results
    
    if search_type in ["news", "both"]:
        news_results = search_legal_news(query, entities, bioes_tags)
        results["news_results"] = news_results
    
    # Combine and format results
    results["combined_context"] = format_search_results(
        web_results=results["web_results"],
        news_results=results["news_results"]
    )
    
    # Extract sources for citation
    results["sources"] = extract_sources(results["web_results"] + results["news_results"])
    
    results["search_time_seconds"] = round(time.time() - search_start, 3)
    
    return results


def format_search_results(web_results: List[Dict], news_results: List[Dict]) -> str:
    """
    Format web and news results for LLM context
    
    Args:
        web_results: List of web search results
        news_results: List of news search results
    
    Returns:
        Formatted string for LLM context
    """
    formatted_parts = []
    
    if web_results:
        formatted_parts.append("="*60)
        formatted_parts.append("LEGAL INFORMATION:")
        formatted_parts.append("="*60)
        for idx, result in enumerate(web_results, 1):
            title = result.get("title", "N/A")
            url = result.get("href", result.get("url", "N/A"))
            body = result.get("body", "")
            
            formatted_parts.append(f"\n[Web Result {idx}]")
            formatted_parts.append(f"Title: {title}")
            formatted_parts.append(f"Source: {url}")
            formatted_parts.append(f"Content: {body[:500]}{'...' if len(body) > 500 else ''}")
    
    if news_results:
        formatted_parts.append("\n" + "="*60)
        formatted_parts.append("RECENT LEGAL DEVELOPMENTS:")
        formatted_parts.append("="*60)
        for idx, result in enumerate(news_results, 1):
            title = result.get("title", "N/A")
            url = result.get("url", result.get("href", "N/A"))
            date = result.get("date", "N/A")
            body = result.get("body", "")
            
            formatted_parts.append(f"\n[News Result {idx}]")
            formatted_parts.append(f"Title: {title}")
            formatted_parts.append(f"Source: {url}")
            formatted_parts.append(f"Date: {date}")
            formatted_parts.append(f"Content: {body[:500]}{'...' if len(body) > 500 else ''}")
    
    # Removed notes about sources - present information naturally
    
    return "\n".join(formatted_parts) if formatted_parts else ""


def extract_sources(results: List[Dict]) -> List[Dict]:
    """
    Extract sources from search results for citation
    
    Args:
        results: List of search results
    
    Returns:
        List of source dictionaries
    """
    sources = []
    
    for result in results:
        url = result.get("href", result.get("url", ""))
        title = result.get("title", "")
        
        if url:
            sources.append({
                "type": "web" if "href" in result else "news",
                "title": title,
                "url": url,
                "citation": f"{title} ({url})"
            })
    
    return sources


def should_trigger_web_search(
    query: str,
    retrieved_docs: Dict,
    entities: List[Dict] = None,
    bioes_tags: List[Dict] = None,
    min_results_threshold: int = 1
) -> bool:
    """
    Determine if web search should be triggered
    DEFAULT: Always returns True for all ASK queries (web search is default)
    
    Args:
        query: User's query
        retrieved_docs: Results from local document retrieval
        entities: Detected entities from NER
        bioes_tags: BIOES tags from tagging phase
        min_results_threshold: Minimum local results to skip web search (not used when default is True)
    
    Returns:
        True (web search is default for all ASK queries)
    """
    # DEFAULT: Web search is enabled for all ASK queries
    # This ensures comprehensive results by combining local docs + web search
    return True
