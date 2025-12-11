# مرحله 1: ساخت (Build)
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# مرحله 2: اجرا (Production)
FROM nginx:alpine
# کپی فایل‌های ساخته شده
COPY --from=build /app/dist /usr/share/nginx/html

# تغییر پورت پیش‌فرض Nginx از 80 به 3000
RUN sed -i 's/listen       80;/listen       3000;/' /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
