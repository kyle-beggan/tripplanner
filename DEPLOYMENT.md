# Deploying LFG Places to AWS Lightsail

This guide outlines the steps to deploy your Next.js application to an AWS Lightsail instance.

## 1. Choose a Blueprint
For a Next.js 16 application updates, the recommended blueprint is **Node.js** (found under **Apps + OS**).
*   **Blueprint**: Node.js
*   **Version**: Latest available (e.g., Node.js 20 or 22)
*   **Why**: It comes pre-installed with Node.js, NPM, and PM2 (Process Manager), saving you from manual server configuration.

**Alternative**: You can use **Ubuntu 22.04 LTS** (OS Only) if you prefer to manage the environment yourself using `nvm`.

## 2. Server Setup
Once your instance is running:

1.  **Static IP**: Create and attach a static IP to your instance in the Networking tab.
2.  **Firewall**: Ensure port **3000** (or your chosen port) is open if you plan to access it directly, or set up a reverse proxy (Apache/Nginx) to forward port 80/443 to 3000. The Bitnami stack usually includes Apache.

## 3. Deployment Steps

### A. Connect to Instance
SSH into your server using the browser console or your local terminal.

### B. Clone Repository
```bash
git clone https://github.com/kyle-beggan/tripplanner.git
cd tripplanner
```

### C. Install Dependencies
```bash
npm install
```
*Note: If you encounter memory issues during install/build on a small instance (e.g., $3.50 plan), you may need to enable swap memory.*

### D. Environment Variables
Create a `.env.local` file with your production keys:
```bash
nano .env.local
```
Paste your variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### E. Build Application
```bash
npm run build
```

### F. Start with PM2
Use PM2 to keep your app running in the background:
```bash
pm2 start npm --name "lfg-places" -- start
pm2 save
```

pm2 save
```

## 5. Setting up Continuous Deployment (Git Push to Deploy)
To automatically deploy when you push to GitHub, you need to set up **GitHub Secrets**:

1.  Go to your repository on GitHub -> **Settings** -> **Secrets and variables** -> **Actions**.
2.  Add the following **Repository secrets**:
    *   `HOST`: Your Lightsail Static IP address.
    *   `USERNAME`: `bitnami` (for Node.js blueprints) or `ubuntu`.
    *   `SSH_KEY`: The content of your private key (downloaded from Lightsail).
        *   *Tip: Use `cat key.pem` locally to copy it.*

**Note**: GitHub Secrets are **write-only**. Once you save them, you cannot view the value again, only update it. If you are unsure if it saved correctly, check the "Updated" timestamp or simply update it again.

Once configured, every push to `main` will trigger the deployment workflow defined in `.github/workflows/deploy.yml`.

## 6. Domain & SSL
1.  **DNS**: Point your domain's A record to your Lightsail Static IP.
2.  **HTTPS**: Bitnami instances usually come with a `bncert-tool` to easily set up Let's Encrypt SSL certificates for Apache/Nginx.

## 5. Troubleshooting

### "git: command not found"
If `git` is not installed on your server (which can happen with minimal blueprints), install it:
```bash
sudo apt-get update
sudo apt-get install git -y
```

### "pm2: command not found"
If `pm2` is not installed:
```bash
sudo npm install -g pm2
```

### "ssh: handshake failed: ssh: unable to authenticate"
This means the GitHub Action cannot authenticate with your server using the provided `SSH_KEY`.
**Check the following:**
1.  **Username**: Verify if you should use `bitnami` (for Node.js blueprints) or `ubuntu`. Try changing the `USERNAME` secret.
2.  **Key Format**: Ensure you copied the **entire** contents of the `.pem` file, including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`.
3.  **Newlines**: Sometimes copying from the terminal can mess up newlines. Try `cat key.pem | pbcopy` (Mac) or opening it in a text editor to copy.

### "Could not read package.json" Error
This usually happens if you try to run `npm install` **before** entering the project directory.
**Fix**: Make sure to run `cd` after cloning:
```bash
git clone https://github.com/kyle-beggan/tripplanner.git
cd tripplanner  <-- IMPORTANT
npm install
```

### "Permission denied"
If valid permissions are not set, try running the command with `sudo` (e.g. `sudo npm install -g pm2`).

## 6. Configuring Web Server (Reverse Proxy)
To access your app without typing `:3000`, configure Apache to forward traffic from port 80 to 3000.

1.  Create a configuration file (replace `your-domain.com` with your actual domain or IP):
    ```bash
    sudo nano /opt/bitnami/apache/conf/vhosts/myapp-vhost.conf
    ```
2.  Paste the following content:
    ```apache
    <VirtualHost *:80>
        ServerName your-domain.com
        ServerAlias www.your-domain.com
        ProxyPass / http://127.0.0.1:3000/
        ProxyPassReverse / http://127.0.0.1:3000/
    </VirtualHost>
    ```
3.  Restart Apache:
    ```bash
    sudo /opt/bitnami/ctlscript.sh restart apache
    ```

## 7. Configuring HTTPS (Reverse Proxy)
If `https://your-domain.com` still shows the default page, you need to configure the 443 block.

1.  **Generate Certificates** (if you haven't yet):
    ```bash
    sudo /opt/bitnami/bncert-tool
    ```
    Follow the prompts.

2.  **Edit your config again**:
    ```bash
    sudo nano /opt/bitnami/apache/conf/vhosts/myapp-vhost.conf
    ```

3.  **Append the HTTPS block** (below the existing block):
    ```apache
    <VirtualHost *:443>
        ServerName your-domain.com
        ServerAlias www.your-domain.com
        
        SSLEngine on
        SSLCertificateFile "/opt/bitnami/apache/conf/your-domain.com.crt"
        SSLCertificateKeyFile "/opt/bitnami/apache/conf/your-domain.com.key"
        
        ProxyPass / http://127.0.0.1:3000/
        ProxyPassReverse / http://127.0.0.1:3000/
    </VirtualHost>
    ```
    *Note: Verify the path to your `.crt` and `.key` files. `bncert-tool` usually tells you where they are, or links them in `/opt/bitnami/apache/conf/`.*

4.  **Restart Apache**:
    ```bash
    sudo /opt/bitnami/ctlscript.sh restart apache
    ```
