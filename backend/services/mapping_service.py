from typing import List, Optional, Dict
from sqlalchemy.orm import Session
import models
from collections import Counter

def generate_all_substrings(text: str) -> List[str]:
    """
    Decomposes text into all possible substrings of words.
    Example: "Milk Frsh Alpine" -> [milk, frsh, alpine, milk frsh, milk frsh alpine, frsh alpine]
    """
    words = text.lower().split()
    n = len(words)
    substrings = []
    for i in range(n):
        for j in range(i + 1, n + 1):
            substrings.append(" ".join(words[i:j]))
    return substrings

def find_most_common_friendly_name(mappings: List[models.FriendlyName]) -> Optional[str]:
    if not mappings:
        return None
    
    names = [m.friendly_name for m in mappings]
    counts = Counter(names)
    most_common = counts.most_common()
    
    if len(most_common) > 1 and most_common[0][1] == most_common[1][1]:
        # It's a tie
        return None
    
    return most_common[0][0]

def get_friendly_name(db: Session, original_name: str, user_id: int) -> str:
    """
    Logic from Section 9.1:
    1. Check user-specific mappings for all substrings.
    2. Check global mappings for all substrings.
    3. Default to original.
    """
    try:
        substrings = generate_all_substrings(original_name)
        
        # Step 1: Check user-specific mappings
        user_mappings = db.query(models.FriendlyName).filter(
            models.FriendlyName.user_id == user_id,
            models.FriendlyName.substring.in_(substrings)
        ).all()
        
        winner = find_most_common_friendly_name(user_mappings)
        if winner:
            return winner
            
        # Step 2: Check global mappings
        global_mappings = db.query(models.FriendlyName).filter(
            models.FriendlyName.substring.in_(substrings),
            models.FriendlyName.user_id != user_id
        ).all()
        
        winner = find_most_common_friendly_name(global_mappings)
        if winner:
            return winner
    except Exception as e:
        print(f"DEBUG: Error in get_friendly_name: {e}")
        
    # Step 3: Default
    return original_name

def set_friendly_name(db: Session, original_name: str, friendly_name: str, user_id: int):
    """
    Logic from Section 9.2:
    Store mappings for each substring of the original name.
    """
    try:
        substrings = generate_all_substrings(original_name)
        
        for sub in substrings:
            # Check if this exact mapping already exists for this user
            existing = db.query(models.FriendlyName).filter(
                models.FriendlyName.user_id == user_id,
                models.FriendlyName.substring == sub,
                models.FriendlyName.friendly_name == friendly_name
            ).first()
            
            if not existing:
                new_mapping = models.FriendlyName(
                    user_id=user_id,
                    substring=sub,
                    friendly_name=friendly_name
                )
                db.add(new_mapping)
        
        db.commit()
    except Exception as e:
        print(f"DEBUG: Error in set_friendly_name: {e}")
        db.rollback()

def get_category_mapping(db: Session, friendly_name: str, user_id: int) -> Optional[Dict[str, Optional[str]]]:
    """
    Retrieves stored categories for a given friendly name.
    Logic:
    1. Check user-specific mapping.
    2. Check global mapping (random from other users).
    """
    if not friendly_name:
        return None
        
    try:
        # Step 1: User-specific
        mapping = db.query(models.CategoryMapping).filter(
            models.CategoryMapping.user_id == user_id,
            models.CategoryMapping.friendly_name == friendly_name
        ).first()
        
        if mapping:
            return {
                "category_level_1": mapping.category_level_1,
                "category_level_2": mapping.category_level_2,
                "category_level_3": mapping.category_level_3
            }
            
        # Step 2: Global (fallback)
        global_mapping = db.query(models.CategoryMapping).filter(
            models.CategoryMapping.friendly_name == friendly_name,
            models.CategoryMapping.user_id != user_id
        ).first()
        
        if global_mapping:
            return {
                "category_level_1": global_mapping.category_level_1,
                "category_level_2": global_mapping.category_level_2,
                "category_level_3": global_mapping.category_level_3
            }
    except Exception as e:
        print(f"DEBUG: Error in get_category_mapping: {e}")
    
    return None

def set_category_mapping(db: Session, friendly_name: str, categories: Dict[str, Optional[str]], user_id: int):
    """
    Stores or updates a category mapping for the user.
    """
    if not friendly_name:
        return

    try:
        # Check existing
        mapping = db.query(models.CategoryMapping).filter(
            models.CategoryMapping.user_id == user_id,
            models.CategoryMapping.friendly_name == friendly_name
        ).first()
        
        c1 = categories.get("category_level_1")
        c2 = categories.get("category_level_2")
        c3 = categories.get("category_level_3")

        # Only update if at least one category is provided?
        # User requirement: "When he saves... category mapping is updated for all items that have any category."
        # If user clears categories, should we clear mapping? probably.
        
        if mapping:
            mapping.category_level_1 = c1
            mapping.category_level_2 = c2
            mapping.category_level_3 = c3
        else:
            new_mapping = models.CategoryMapping(
                user_id=user_id,
                friendly_name=friendly_name,
                category_level_1=c1,
                category_level_2=c2,
                category_level_3=c3
            )
            db.add(new_mapping)
        
        db.commit()
    except Exception as e:
        print(f"DEBUG: Error in set_category_mapping: {e}")
        db.rollback()
