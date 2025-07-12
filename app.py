import io
import os
import zipfile
import logging
import threading
import time
import random
import bs4  # BeautifulSoup
import requests
import urllib.parse
from flask import Flask, jsonify, render_template, request, flash, Response, redirect, request, abort, send_file
from media_scraper import MediaScraper
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Initialize media scraper
scraper = MediaScraper()

@app.template_filter('url_encode')
def url_encode_filter(s):
    return urllib.parse.quote_plus(s)
  

@app.route('/force-download')
def force_download():
    url = request.args.get('url')
    if not url:
        return "Parâmetro 'url' é obrigatório.", 400

    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://v54.erome.com/"
    }

    try:
        r = requests.get(url, headers=headers, stream=True)
        r.raise_for_status()

        filename = url.split('/')[-1]  # Pega "N56cQvqO_720p.mp4"

        return Response(
            r.iter_content(chunk_size=8192),
            content_type=r.headers.get('Content-Type', 'application/octet-stream'),
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"'
            }
        )
    except requests.RequestException as e:
        return f"Erro ao baixar o vídeo: {str(e)}", 500

      
@app.route('/')
def index():
    """Página principal com formulário para inserir URL"""
    return render_template('index.html')

@app.route('/ping')
def ping():
    respostas = [
        "Pong! Tô aqui, firme e forte!",
        "Ping recebido! Tudo nos trinques!",
        "Hey! Servidor acordado e dançando!",
        "Pong! Vamos que vamos!",
        "Pong chegou! Servidor turbo ativado!"
    ]
    mensagem = random.choice(respostas)
    return jsonify({'message': mensagem})

@app.route('/scrape', methods=['POST'])
def scrape_media():
    """Endpoint para fazer scraping de mídia de uma URL"""
    try:
        url = request.form.get('url', '').strip()

        if not url:
            flash('Por favor, insira uma URL válida.', 'error')
            return render_template('index.html')

        parsed_url = urlparse(url)
        if not parsed_url.scheme or not parsed_url.netloc:
            flash('URL inválida. Certifique-se de incluir http:// ou https://', 'error')
            return render_template('index.html')

        try:
            response = requests.get(url, timeout=10, allow_redirects=True)

            # Inspecionar conteúdo mesmo com códigos como 410
            soup = bs4.BeautifulSoup(response.text, 'html.parser')
            content_text = soup.get_text(strip=True)

            # Verificações específicas para sites como Erome
            if "Álbum excluído por problemas de direitos autorais" in content_text:
                flash("Este álbum foi excluído por problemas de direitos autorais.", 'warning')
                return render_template('index.html')
            elif response.status_code == 404:
                flash("Página não encontrada (Erro 404).", 'warning')
                return render_template('index.html')
            elif response.status_code == 410:
                flash("Esta página foi removida permanentemente pelo servidor.", 'warning')
                return render_template('index.html')
            elif response.status_code == 403:
                flash("Acesso proibido à página (Erro 403).", 'warning')
                return render_template('index.html')
            elif response.status_code == 401:
                flash("Autenticação necessária para acessar esta página (Erro 401).", 'warning')
                return render_template('index.html')
            elif response.status_code >= 500:
                flash("Erro no servidor do site. Tente novamente mais tarde.", 'warning')
                return render_template('index.html')

        except requests.exceptions.ConnectionError:
            flash("Erro de conexão. Verifique sua internet ou se o site está fora do ar.", 'error')
            return render_template('index.html')
        except requests.exceptions.Timeout:
            flash("O site está muito lento ou travado. Tente novamente.", 'error')
            return render_template('index.html')
        except requests.exceptions.RequestException:
            flash("Erro ao tentar acessar a página.", 'error')
            return render_template('index.html')

        # Fazer scraping real após verificar possíveis erros
        app.logger.info(f"Iniciando scraping da URL: {url}")
        media_data = scraper.scrape_media(url)

        if not media_data['images'] and not media_data['videos']:
            flash('Nenhuma mídia encontrada nesta página.', 'warning')
            return render_template('index.html')

        app.logger.info(f"Scraping concluído. Imagens: {len(media_data['images'])}, Vídeos: {len(media_data['videos'])}")

        return render_template('results.html',
                               media_data=media_data,
                               original_url=url)

    except Exception as e:
        app.logger.error(f"Erro inesperado durante o scraping: {str(e)}")
        flash("Ocorreu um erro inesperado. Tente novamente mais tarde.", 'error')
        return render_template('index.html')

@app.route('/validate_url', methods=['POST'])
def validate_url():
    """Endpoint AJAX para validação de URL em tempo real"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'valid': False, 'message': 'URL não pode estar vazia'})
        
        parsed_url = urlparse(url)
        if not parsed_url.scheme or not parsed_url.netloc:
            return jsonify({'valid': False, 'message': 'Formato de URL inválido'})
        
        return jsonify({'valid': True, 'message': 'URL válida'})
    
    except Exception as e:
        return jsonify({'valid': False, 'message': 'Erro na validação'})

def auto_ping():
    """Thread que pinga o próprio app a cada 5 a 10 minutos para mantê-lo online"""
    url = os.environ.get("APP_URL", "https://handsome-tourmaline-wing.glitch.me/ping")
    while True:
        try:
            response = requests.get(url)
            app.logger.info(f"Auto-ping enviado para {url} com status {response.status_code}")
        except Exception as e:
            app.logger.error(f"Erro no auto-ping: {e}")
        wait = random.randint(300, 600)  # espera entre 5 e 10 minutos
        time.sleep(wait)

if __name__ == '__main__':
    # Inicia a thread do auto-ping em background
    threading.Thread(target=auto_ping, daemon=True).start()
    app.run(host="0.0.0.0", port=5000, debug=True)