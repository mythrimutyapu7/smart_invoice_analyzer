# Proprietary Information Extraction Pipeline (LayoutLM v3)

This directory contains the core implementation of our layout-aware invoice extraction engine.

## Overview
Unlike standard OCR systems that treat text as a simple sequence, our pipeline utilizes **LayoutLM v3**, a Multi-modal (Text + Layout + Image) Transformer model. This allows the system to understand the spatial relationships between fields (e.g., that a number appearing next to the word "Total" is likely the invoice amount).

## Components
- **`layoutlm_processor.py`**: Handles model initialization and real-time inference using token classification.
- **`ocr_engine.py`**: Specialized OCR preprocessing to extract geometric features (bounding boxes).
- **`training_pipeline.py`**: Proprietary fine-tuning scripts used to optimize the model on our custom financial dataset.

## Technical Specifications
- **Architecture**: Multi-modal Transformer (LayoutLM v3)
- **Base Model**: `microsoft/layoutlmv3-base`
- **Trained Classes**: `VENDOR`, `DATE`, `invoice_no`, `TOTAL`, `TAX`, `CURRENCY`
- **Input Resolution**: 224x224 (Visual Backbone) + Normalized 1000x1000 (Layout)

## Note on Integration
The current production environment is configured to use the **High-Level Gemini Insight API** for maximum reliability and throughput. The local LayoutLM models are used for research, training data generation, and fallback scenarios.
