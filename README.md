# michalantkowiak.github.io

Portfolio: mechanika, elektronika i kod. Strona działa pod adresem <https://michalantkowiak.github.io/>.

Strona jest statyczna i nie wymaga budowania: całość to `index.html` (treść i style) oraz pliki w `assets/`.

## Co gdzie jest

| Plik | Zawartość |
| --- | --- |
| `index.html` | treść strony, style, rysunki SVG (schemat, płytka, dron, pokój pomiarowy) |
| `assets/viewer.js` | rys. 1: model zespołu rysowany na żywo w WebGL, widok rozstrzelony i przekrój |
| `assets/chess.js` | silnik szachowy (minimax o głębokości 2) i szachownica |
| `assets/site.js` | motyw, powiększenia, podświetlanie elementów, filtr Kalmana, stacja pogodowa |
| `assets/Zespol1.glb` | model zespołu wyeksportowany z Inventora |
| `assets/*.png`, `assets/doniczka.jpg` | rysunki wykonawcze i zdjęcia |
| `assets/czujnik-env.kicad_*` | projekt KiCada, z którego powstają rysunki 6 i 7 |
| `assets/fonts/` | czcionki z licencjami (`LICENCJE.txt`) |
| `tools/kicad/` | skrypty rysujące schemat i płytkę z plików KiCada |

## Typowe zmiany

- **Teksty i projekty**: edytuj `index.html`. Każdy projekt to jeden blok `<article class="project">`.
- **Nowy model 3D**: podmień `assets/Zespol1.glb`. Numery na liście części biorą się z nazw części w zespole (`1:1`, `2:1` i tak dalej); przesunięcia w widoku rozstrzelonym ustawia funkcja `partFor` na początku `assets/viewer.js`.
- **Zmieniony schemat albo płytka**: podmień pliki w `assets/` i uruchom

  ```
  python3 tools/kicad/odswiez.py
  ```

  Skrypt przerysuje rysunki 6 i 7 w `index.html`. Tabelę elementów obok płytki poprawia się ręcznie; skrypt wypisze, czego w niej brakuje.
- **Data w tabliczce na dole strony**: pole „Aktualizacja” w `index.html`.

## Podgląd na własnym komputerze

Model 3D wczytuje się tylko przez serwer, więc zamiast otwierać plik bezpośrednio uruchom w katalogu repozytorium:

```
python3 -m http.server 8000
```

i wejdź na <http://localhost:8000/>.
