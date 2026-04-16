@echo off
echo Starting Real-Time Messaging Backend...
cd /d %~dp0
pip install -r requirements.txt
python manage.py runserver 8000
pause
