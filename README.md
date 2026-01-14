# 🔗 LinknLink

> Your modern, beautiful link management application built with Next.js and PocketBase

![LinknLink Banner](https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react)
![PocketBase](https://img.shields.io/badge/PocketBase-Latest-B8DBE4?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## 📸 Screenshots

<div align="center">
  <img src="screenshoots/image1.png" alt="LinknLink Screenshot 1" width="45%" style="margin: 10px;">
  <img src="screenshoots/image2.png" alt="LinknLink Screenshot 2" width="45%" style="margin: 10px;">
  <img src="screenshoots/image3.png" alt="LinknLink Screenshot 3" width="45%" style="margin: 10px;">
  <img src="screenshoots/image4.png" alt="LinknLink Screenshot 4" width="45%" style="margin: 10px;">
</div>

## ✨ Features

### 🎯 Core Functionality
- **📚 Bookmark Management** - Save, organize, and manage all your important links in one place
- **🏷️ Smart Tagging** - Create custom tags with colors to organize your bookmarks
- **🔍 Powerful Search** - Find links instantly with debounced search functionality
- **🎨 View Modes** - Switch between grid and list views for optimal browsing
- **📱 Responsive Design** - Beautiful UI that works seamlessly on all devices


## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** 

1. **Clone the repository**
   ```bash
   git clone https://github.com/sonmezerekrem/linknlink.git
   cd linknlink
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file (optional, has defaults)
   cat > .env << EOF
   POCKETBASE_DOMAIN=http://localhost:8090
   POCKETBASE_ADMIN_EMAIL=admin@example.com
   POCKETBASE_ADMIN_PASSWORD=admin123456789
   POCKETBASE_URL=http://backend:8090
   NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
   EOF
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: [http://localhost:3001](http://localhost:3001)
   - Backend Admin: [http://localhost:8090/_](http://localhost:8090/_)


## 🗺️ Roadmap

- [ ] Export/Import bookmarks
- [ ] Browser extension
- [ ] Collections/folders
- [ ] Sharing links
- [ ] Analytics dashboard
- [ ] Mobile Apps


