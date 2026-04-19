---
title: Ws:Database Design:Overview
sidebar_label: Ws:Database Design:Overview
id: overview
---

**Version:** <span style="color: rgb(204, 204, 204);">1.0.0</span>  
**Last Updated:** <span style="color: rgb(204, 204, 204);">2026-04-18</span>  
**Database Engine:** <span style="color: rgb(204, 204, 204);">MongoDB 6+ (via Motor async driver)</span>  
**Cache / Ephemeral Store:** <span style="color: rgb(204, 204, 204);">Redis 7+ (via </span> `redis[hiredis]` <span style="color: rgb(204, 204, 204);">async pool)</span>  
**Default Database Name:** `deltalabs`

<span style="color: rgb(204, 204, 204);">DeltaLabs uses a </span> **dual-store architecture**<span style="color: rgb(204, 204, 204);">:</span>

Store

Purpose

Driver

MongoDB

Primary persistent store for all domain entities

<span style="color: rgb(204, 204, 204);">Motor (async) via </span> `AsyncIOMotorDatabase`

**Redis**

<span style="color: rgb(204, 204, 204);">Ephemeral state (OTP, signup flows, recovery), rate limiting, real-time pub/sub, engagement event streams</span>

`redis.asyncio` <span style="color: rgb(204, 204, 204);">with </span> `hiredis` <span style="color: rgb(204, 204, 204);">parser</span>

<span style="color: rgb(204, 204, 204);">All document </span> `_id` <span style="color: rgb(204, 204, 204);">fields use </span> **application-generated UUIDs** <span style="color: rgb(204, 204, 204);">(</span>`uuid4()`<span style="color: rgb(204, 204, 204);">) as strings, except for collections with domain-specific prefixes (e.g. </span> `school_`<span style="color: rgb(204, 204, 204);">, </span> `mkt_`<span style="color: rgb(204, 204, 204);">, </span> `offer_`<span style="color: rgb(204, 204, 204);">, </span> `feat_`<span style="color: rgb(204, 204, 204);">).</span>

Parameter

Default

Description

<span style="color: rgb(215, 186, 125);">MONGODB_URI</span>

<span style="color: rgb(215, 186, 125);">mongodb://localhost:27017</span>

MongoDB connection string

<span style="color: rgb(215, 186, 125);">MONGODB_DB_NAME</span>

<span style="color: rgb(215, 186, 125);">deltalabs</span>

Target Database name
