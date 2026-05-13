"""
Re-export Base from db.database so models can import from a single location.
Also import all models here so that `Base.metadata.create_all()` discovers them.
"""
from db.database import Base  # noqa: F401

# Import models to register them with the metadata
import models.user       # noqa: F401
import models.document   # noqa: F401
