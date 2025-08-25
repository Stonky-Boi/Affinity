# Affinity

Affinity is a social media database system designed to model real-world online communities.  
It emphasizes efficient data management, transparency, and strong support for real-time interactions, multimedia content, and complex social relationships.

---

## Problem Implementation

The proposed project implements a **social media database system** designed to manage complex social interactions, multimedia content, and user engagement while ensuring scalability, transparency, and efficient data handling.

### Core Entities
At the foundation of the system are three **strong entities**:
- **User**: Represents the core identity of each participant, storing login credentials, personal details, profiles, and customizable privacy settings.  
- **Post**: Encapsulates user-generated content, including text, media, timestamps, and visibility settings.  
- **Comment**: Enables threaded discussions by linking user input to posts and supporting hierarchical replies via parent–child comment structures.  

### Weak Entities
Two **weak entities** capture dependent relationships:
- **Reaction**: Represents user engagement with posts. Each reaction is uniquely identified by the combination of a user and a post, along with the reaction type (e.g., like, dislike, emoji).  
- **Message**: Models direct communication between two users. Since its identity depends on the interacting pair and the timestamp, it is treated as a weak entity.  

### Associative Entities
To capture the complexity of social interactions, two **associative entities** are introduced:
- **Friendship**: Represents a mutual relationship between two users. It stores metrics such as number of exchanged messages, likes, and comments, which are combined into a computed *Friendship Score* for ranking and recommendation purposes.  
- **Following**: Captures one-directional connections, storing status and timestamp to differentiate between active and pending follow requests.  

### Relationships and Behavior
The system’s relationships reflect real-world behaviors on social networks:
- Users can **create** posts and **make** comments.  
- Posts themselves **have** comments to enable rich interaction threads.  
- Users can **give** reactions to posts, linking engagement directly to content.  
- Users can **send** messages to each other, forming conversations.  
- **Friendships** and **Followings** together model both mutual and one-way social bonds.  

---

### Summary
These entities and relationships form a tightly interconnected structure that mirrors real-world online communities, ensuring support for:
- User identity and privacy  
- Social connectivity (mutual and one-way)  
- Interactive engagement through content, comments, reactions, and communication   

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
