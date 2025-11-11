# Authentication & Authorization

## Overview

CoShop uses JWT (JSON Web Tokens) for stateless authentication and role-based access control (RBAC) for authorization. This approach provides secure, scalable authentication without server-side session storage.

## Authentication Flow

### Registration Flow

```
Client                    API                     Database
  │                        │                         │
  │──Register Request──────>│                         │
  │  (email, password)      │                         │
  │                         │──Check Email Unique────>│
  │                         │<────Result──────────────│
  │                         │                         │
  │                         │──Hash Password──────────│
  │                         │  (bcrypt, 10 rounds)    │
  │                         │                         │
  │                         │──Insert User───────────>│
  │                         │<────User Created────────│
  