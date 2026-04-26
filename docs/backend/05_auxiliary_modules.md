# Auxiliary Modules Workflow

This document details the utility modules that support the core machine learning pipeline operations.

## 1. Logging Infrastructure (`backend/logger.py`)
To ensure robust debugging and auditing, the backend implements a unified logging architecture.
- Initializes a custom `logging.Logger` instance.
- Formats log outputs with standardized timestamps, log levels, and module names.
- Outputs logs both to the standard output (stdout) for containerized environments and to a persistent `backend.log` file for historical traceback.

## 2. Weight Management (`backend/ml/weights.py`)
Handling large machine learning model artifacts requires strict path resolution and validation.
- Provides robust utility wrappers (`save_torch_checkpoint`, `load_torch_checkpoint`) around `torch.load` and `torch.save`.
- Manages the extraction of specific `state_dict` structures and associated metadata from PyTorch payload dictionaries, safely allocating them to the configured compute device (`map_location`).
