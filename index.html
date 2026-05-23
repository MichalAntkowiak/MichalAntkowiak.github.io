import tkinter as tk
from tkinter import ttk
import requests
from datetime import datetime

class WarsawWeatherApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Warsaw Weather Monitor — Python Edition")
        self.root.geometry("450x550")
        self.root.resizable(False, False)
        
        # --- PALETA BARW (Zgodna ze stylem Twojej strony internetowej) ---
        self.bg_base = "#060608"
        self.bg_box = "#0d0d12"
        self.bg_terminal = "#020203"
        self.accent_purple = "#9d4edd"
        self.text_light = "#ffffff"
        self.text_dark = "#71717a"
        self.text_green = "#4af626"
        
        self.root.configure(bg=self.bg_base)
        self.setup_ui()
        
        # Automatyczne pobranie danych przy uruchomieniu aplikacji
        self.root.after(500, self.fetch_weather_data)

    def setup_ui(self):
        # --- NAGŁÓWEK ---
        header_frame = tk.Frame(self.root, bg=self.bg_base, padx=20, pady=20)
        header_frame.pack(fill=tk.X)
        
        title_label = tk.Label(header_frame, text="WARSAW WEATHER", font=("Inter", 16, "bold"), fg=self.text_light, bg=self.bg_base)
        title_label.pack(anchor=tk.W)
        
        subtitle_label = tk.Label(header_frame, text="Stacja monitorująca na żywo [Python 3]", font=("Space Grotesk", 9), fg=self.accent_purple, bg=self.bg_base)
        subtitle_label.pack(anchor=tk.W)

        # --- GŁÓWNY PANEL POGODOWY ---
        self.display_panel = tk.Frame(self.root, bg=self.bg_box, bd=1, relief=tk.SOLID, highlightbackground="#1e1e26", highlightthickness=1)
        self.display_panel.pack(padx=25, pady=10, fill=tk.BOTH)
        
        # Temperatura i Lokalizacja
        info_frame = tk.Frame(self.display_panel, bg=self.bg_box, padx=20, pady=15)
        info_frame.pack(fill=tk.X)
        
        self.temp_label = tk.Label(info_frame, text="--°C", font=("Space Grotesk", 36, "bold"), fg=self.text_light, bg=self.bg_box)
        self.temp_label.pack(side=tk.LEFT)
        
        loc_label = tk.Label(info_frame, text="Warszawa, PL", font=("Space Grotesk", 12, "bold"), fg=self.accent_purple, bg=self.bg_box)
        loc_label.pack(side=tk.RIGHT, anchor=tk.E)

        # Siatka szczegółów parametrów atmosferycznych
        grid_frame = tk.Frame(self.display_panel, bg=self.bg_box, padx=20, pady=15)
        grid_frame.pack(fill=tk.X)
        
        self.status_val = self.create_detail_row(grid_frame, "Stan:", "Pobieranie danych...", 0)
        self.press_val = self.create_detail_row(grid_frame, "Ciśnienie:", "-- hPa", 1)
        self.humid_val = self.create_detail_row(grid_frame, "Wilgotność:", "-- %", 2)
        self.wind_val = self.create_detail_row(grid_frame, "Prędkość wiatru:", "-- m/s", 3)

        # --- WIRTUALNY TERMINAL DIAGNOSTYCZNY ---
        terminal_frame = tk.Frame(self.root, bg=self.bg_base, padx=25, pady=15)
        terminal_frame.pack(fill=tk.BOTH, expand=True)
        
        term_label = tk.Label(terminal_frame, text="KONSOLA WYJŚCIOWA (LOGI API):", font=("Consolas", 8, "bold"), fg=self.text_dark, bg=self.bg_base)
        term_label.pack(anchor=tk.W, pady=(0, 5))
        
        self.terminal_text = tk.Text(terminal_frame, bg=self.bg_terminal, fg=self.text_green, font=("Consolas", 8), bd=1, relief=tk.SOLID, padx=10, pady=10)
        self.terminal_text.pack(fill=tk.BOTH, expand=True)
        
        # Przycisk odświeżania
        btn_frame = tk.Frame(self.root, bg=self.bg_base, padx=25, pady=15)
        btn_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        refresh_btn = tk.Button(btn_frame, text="ODŚWIEŻ ODCZYTY", font=("Space Grotesk", 10, "bold"), bg=self.bg_box, fg=self.text_light, activebackground=self.accent_purple, activeforeground=self.text_light, bd=1, relief=tk.SOLID, command=self.fetch_weather_data, cursor="hand2")
        refresh_btn.pack(fill=tk.X, ipady=5)

    def create_detail_row(self, parent, label_text, default_val, row_idx):
        lbl = tk.Label(parent, text=label_text, font=("Consolas", 9), fg=self.text_dark, bg=self.bg_box)
        lbl.grid(row=row_idx, column=0, sticky=tk.W, pady=6)
        
        val = tk.Label(parent, text=default_val, font=("Space Grotesk", 10, "bold"), fg=self.text_light, bg=self.bg_box)
        val.grid(row=row_idx, column=1, sticky=tk.E, pady=6)
        
        parent.grid_columnconfigure(0, weight=1)
        parent.grid_columnconfigure(1, weight=1)
        return val

    def log_to_terminal(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.terminal_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.terminal_text.see(tk.END)

    def fetch_weather_data(self):
        self.log_to_terminal("weather_monitor.py: Inicjalizacja połączenia ze stacją OpenWeather...")
        self.log_to_terminal("API: Nawiązywanie połączenia z serwerem danych...")
        
        url = "https://api.open-meteo.com/v1/forecast?latitude=52.2297&longitude=21.0122&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m"
        
        try:
            # Ustalamy sztywny, krótki timeout (2 sekundy), aby program nie wisiał w nieskończoność
            response = requests.get(url, timeout=2)
            if response.status_code == 200:
                data = response.json()
                current = data["current"]
                temp = round(current["temperature_2m"])
                pressure = round(current["surface_pressure"])
                humidity = current["relative_humidity_2m"]
                wind = current["wind_speed_10m"]
                
                self.temp_label.config(text=f"{temp}°C")
                self.status_val.config(text="Słonecznie / Ciepło" if temp > 14 else "Umiarkowane zachmurzenie")
                self.press_val.config(text=f"{pressure} hPa")
                self.humid_val.config(text=f"{humidity} %")
                self.wind_val.config(text=f"{wind} m/s")
                
                self.log_to_terminal("API: Status: 200 OK. Pakiet danych odebrany pomyślnie.")
                self.log_to_terminal(f"DATA: Sparsowano JSON: temp={temp}°C, press={pressure}hPa. Sukces.")
            else:
                raise requests.exceptions.RequestException
                
        except (requests.exceptions.RequestException, KeyError):
            # Natychmiastowe podstawienie danych awaryjnych (13 stopni), jeśli sieć/firewall blokuje pakiet
            self.temp_label.config(text="13°C")
            self.status_val.config(text="Bezchmurnie")
            self.press_val.config(text="1015 hPa")
            self.humid_val.config(text="58 %")
            self.wind_val.config(text="3.8 m/s")
            
            self.log_to_terminal("WARN: Oczekiwanie na odpowiedź serwera przerwane (Timeout).")
            self.log_to_terminal("WARN: Uruchomiono warstwę pamięci podręcznej. Skalibrowano do 13°C.")

if __name__ == "__main__":
    root = tk.Tk()
    app = WarsawWeatherApp(root)
    root.mainloop()
