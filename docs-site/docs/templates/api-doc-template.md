---
title: API Doc Template
sidebar_label: API Doc Template
---

# API Documentation — Template

Use when documenting a new API or endpoint. Keeps reference docs consistent.

---

## Endpoint

`METHOD /path` (e.g. `POST /v1/enrollments`)

## Summary

One-line description.

## Auth

Required: Yes | No. Scope/role if applicable.

## Request

### Headers

| Header | Required | Description |
|--------|----------|--------------|
| … | … | … |

### Body (if applicable)

Schema and example.

## Response

### Success (e.g. 200)

Schema and example.

### Errors

| Code | When |
|------|------|
| … | … |

## Idempotency

If applicable: Idempotency-Key header and behavior.

## Example

Request/response example.