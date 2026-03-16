from passlib.context import CryptContext
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    h = pwd_context.hash("testpassword")
    print(f"HASH_SUCCESS: {h}")
    v = pwd_context.verify("testpassword", h)
    print(f"VERIFY_SUCCESS: {v}")
except Exception as e:
    print(f"AUTH_DIAGNOSTIC_ERROR: {str(e)}")
    import traceback
    print(traceback.format_exc())
