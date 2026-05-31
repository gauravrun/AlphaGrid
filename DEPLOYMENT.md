# Deployment Guide - Smart Allocation Lab

This guide covers deploying Smart Allocation Lab to production environments.

## Deployment Options

### Option 1: Separate Frontend & Backend (Recommended)

**Backend**: Deploy to Python-compatible platform
**Frontend**: Deploy to static hosting

### Backend Deployment

#### Render.com (Recommended)

1. Create new Web Service
2. Connect GitHub repository
3. Configuration:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3.9+
   - **Root Directory**: `backend`

4. Environment Variables: None required for basic functionality

5. Deploy!

Backend URL: `https://your-app.onrender.com`

#### Railway.app

1. New Project → Deploy from GitHub
2. Select `backend` directory
3. Railway auto-detects Python
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### Heroku

```bash
cd backend
heroku create your-app-name
git subtree push --prefix backend heroku main
```

Add `Procfile`:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Frontend Deployment

#### Vercel (Recommended)

1. Import GitHub repository
2. Framework Preset: Vite
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_URL`: Your backend URL + `/api`

#### Netlify

1. New site from Git
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Environment variables:
   - `VITE_API_URL`: Your backend URL + `/api`

#### GitHub Pages (Static Only)

```bash
cd frontend
npm run build
# Deploy dist folder to gh-pages branch
```

**Note**: Requires CORS configuration on backend

## Production Checklist

### Backend

- [ ] Set CORS allowed origins to frontend URL
- [ ] Configure proper logging
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Enable HTTPS
- [ ] Consider rate limiting
- [ ] Cache frequently accessed data

### Frontend

- [ ] Update VITE_API_URL to production backend
- [ ] Test all API endpoints
- [ ] Verify asset search works
- [ ] Test file uploads
- [ ] Check mobile responsiveness
- [ ] Optimize bundle size

## CORS Configuration

Update `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.vercel.app",
        "https://your-custom-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Environment Variables

### Backend (Optional)

```bash
# None required for basic functionality
# All features work with free data sources
```

### Frontend (Required)

```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

## Performance Optimization

### Backend

1. **Caching**: Market data is cached for 1 hour
2. **Connection pooling**: yfinance handles this automatically
3. **Async operations**: FastAPI handles concurrency well

### Frontend

1. **Code splitting**: Already configured with Vite
2. **Lazy loading**: Consider lazy loading chart components
3. **Image optimization**: Use optimized PNGs for icons

## Monitoring

### Backend Health Check

```
GET https://your-backend.com/health
```

Should return: `{"status": "healthy"}`

### API Documentation

```
https://your-backend.com/docs
```

Swagger UI for testing endpoints

## Troubleshooting

### Common Issues

**Issue**: CORS errors in production

**Solution**: Verify CORS origins in `main.py` match frontend URL exactly

---

**Issue**: yfinance data not loading

**Solution**: Some assets may not be available. Try CSV upload or different assets

---

**Issue**: Slow Monte Carlo simulations

**Solution**: Reduce number of simulations or time horizon

---

**Issue**: Frontend shows "No Analysis Data"

**Solution**: Verify backend API_URL is correct and accessible

## Scaling Considerations

### For High Traffic

1. **Backend**: Use multiple workers in uvicorn
   ```bash
   uvicorn app.main:app --workers 4
   ```

2. **Frontend**: Use CDN for static assets

3. **Database**: Consider adding Redis for caching if needed

4. **Rate Limiting**: Add rate limiting middleware

## Security Best Practices

1. Keep dependencies updated
2. Use HTTPS for all connections
3. Validate all user inputs (already implemented)
4. Don't expose internal errors to users
5. Consider adding API authentication for production use

## Cost Estimation

### Free Tier Options

- **Backend**: Render.com free tier (spins down after inactivity)
- **Frontend**: Vercel/Netlify free tier
- **Total**: $0/month for basic usage

### Paid Options

- **Render.com**: $7/month for always-on backend
- **Railway.app**: Usage-based pricing (~$5-10/month)
- **Custom domain**: ~$12/year

---

**Deployment Time**: ~30 minutes for first deployment

**Maintenance**: Minimal - update dependencies quarterly
