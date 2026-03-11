import sys
import os

# Set current directory to root
root_dir = os.getcwd()
backend_dir = os.path.join(root_dir, 'backend')
sys.path.insert(0, backend_dir)

try:
    from app import create_app
    app = create_app()
    print("SUCCESS: App initialized correctly locally.")
except Exception as e:
    import traceback
    print(f"FAILURE: {e}")
    traceback.print_exc()
    sys.exit(1)
