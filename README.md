# Affinity

Affinity is a social media database system designed to model real-world online communities.  
It emphasizes efficient data management, transparency, and strong support for real-time interactions, multimedia content, and complex social relationships.

---

## Project Overview

At its core, the system is built around the **User** entity, which stores profiles, login credentials, sessions, and customizable preferences.

### Social Connections
- **Friendships** for mutual relationships  
- **Follows** for one-way connections  
- **Friend Interaction Rating**: tracks the frequency and quality of interactions between friends, ranking relationships by activity.  
  - This rating can also be used to recommend new friends and highlight meaningful connections.  

### Content and Engagement
- **Posts** support text, media, and metadata  
- Users can interact via **Comments**, **Likes**, **Shares**, and **Saved Posts**  

### Communication
- **Messages** and **Conversations** for direct interactions  
- **Notifications** to keep users updated in real time  

### Safety
- **Blocked Users** functionality for handling violations and abuse  

---

## Technology Stack

### Frontend
- Vite – Fast build tool and development server  
- HTML/CSS – Semantic markup and styling  
- Tailwind CSS – Utility-first CSS framework for responsive design  
- React – Component-based UI library for interactive interfaces  

### Backend
- Node.js – JavaScript runtime for server-side development  
- Express.js – Web application framework for API development  

### Database
- PostgreSQL – Primary relational database for structured data  
- Redis – In-memory cache for session management and real-time features  
- Prisma – Database ORM for type-safe database access  

### Real-time and Integration
- Socket.io – WebSocket implementation for real-time messaging  
- OAuth – Third-party authentication integration  

---

## System Architecture

```mermaid
flowchart TD
    subgraph Frontend
        Vite --> React
        React --> Tailwind
    end

    subgraph Backend
        NodeJS --> Express
        Express --> SocketIO
        Express --> OAuth
    end

    subgraph Database
        PostgreSQL
        Redis
        Prisma
    end

    Frontend --> Backend
    Backend --> Database
    Database --> Backend
    Backend --> Frontend
````

---

## Project Significance

Affinity demonstrates how database principles can be applied in practice to build a modern social media platform:

* Reliable user and content management
* Efficient data access and interaction handling
* Ranking of friendships through interaction scoring
* Real-time communication and updates

By integrating these features, Affinity shows how careful database design supports the efficiency, safety, and connectivity of online communities.
