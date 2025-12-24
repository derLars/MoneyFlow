from typing import List, Optional
from sqlalchemy.orm import Session
from .. import models, database
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
        models.FriendlyName.substring.in_(substrings)
    ).all()
    
    winner = find_most_common_friendly_name(global_mappings)
    if winner:
        return winner
        
    # Step 3: Default
    return original_name

def set_friendly_name(db: Session, original_name: str, friendly_name: str, user_id: int):
    """
    Logic from Section 9.2:
    Store mappings for each substring of the original name.
    """
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
