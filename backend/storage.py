import os
import shutil

class StorageInterface:
    """A generic contract for all storage operations."""
    def upload_file(self, source_path: str, destination_name: str) -> str:
        """Uploads & updates a file to the storage."""
        raise NotImplementedError

    def upload_fileobj(self, fileobj, destination_name: str) -> str:
        """Uploads a file-like object to the storage."""
        raise NotImplementedError

    def delete_file(self, file_name: str):
        """Deletes a file from the storage."""
        raise NotImplementedError

    def get_file_url(self, file_name: str) -> str:
        """Gets a publicly accessible URL for a file."""
        raise NotImplementedError

class LocalStorage(StorageInterface):
    """Implementation of storage using local filesystem."""
    def __init__(self, base_path: str):
        self.base_path = base_path
        os.makedirs(self.base_path, exist_ok=True)

    def upload_file(self, source_path: str, destination_name: str) -> str:
        dest_path = os.path.join(self.base_path, destination_name)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.copy2(source_path, dest_path)
        return destination_name

    def upload_fileobj(self, fileobj, destination_name: str) -> str:
        dest_path = os.path.join(self.base_path, destination_name)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(fileobj, buffer)
        return destination_name

    def delete_file(self, file_name: str):
        file_path = os.path.join(self.base_path, file_name)
        if os.path.exists(file_path):
            os.remove(file_path)

    def get_file_url(self, file_name: str) -> str:
        # Return full absolute URL to backend API
        # TODO: Make backend URL configurable via config.yaml or env variable
        return f"http://127.0.0.1:8002/api/purchases/images/{file_name}"

def get_storage():
    from database import config
    storage_config = config.get("storage", {})
    
    # Check for 'local' settings specifically as per Section 13
    local_config = storage_config.get("local", {})
    image_path = local_config.get("image_path", "/app/images")
    
    # Convert relative paths to absolute paths
    if not os.path.isabs(image_path):
        # Resolve relative to project root (parent of backend/)
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(backend_dir)
        image_path = os.path.join(project_root, image_path)
        image_path = os.path.abspath(image_path)
    
    print(f"DEBUG: Using storage path: {image_path}")
    return LocalStorage(image_path)
