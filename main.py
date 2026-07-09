import io
import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, Form, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / "data" / "items.json"
STATIC_DIR = BASE_DIR / "static"
UPLOADS_DIR = STATIC_DIR / "uploads"

MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB per photo

DATA_FILE.parent.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
if not DATA_FILE.exists():
    DATA_FILE.write_text("[]", encoding="utf-8")

lock = threading.Lock()

app = FastAPI(title="Museo de Camisetas y Bufandas")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


class Fotos(BaseModel):
    principal: Optional[str] = None
    frente: Optional[str] = None
    trasera: Optional[str] = None


class Item(BaseModel):
    id: str
    tipo: str
    club: str
    temporada: str = ""
    jugador: str = ""
    talla: str = ""
    origen: str = ""
    adquirido: str = ""
    comprador: str = ""
    categoria: str = "club"
    liga: str = ""
    ciudad: str = ""
    pais: str = ""
    autenticidad: str = ""
    historia: str = ""
    fotos: Fotos
    createdAt: str


class ItemForm(BaseModel):
    tipo: str
    club: str
    temporada: str = ""
    jugador: str = ""
    talla: str = ""
    origen: str = ""
    adquirido: str = ""
    comprador: str = ""
    categoria: str = "club"
    liga: str = ""
    ciudad: str = ""
    pais: str = ""
    autenticidad: str = ""
    historia: str = ""


def item_form(
    tipo: str = Form(...),
    club: str = Form(...),
    temporada: str = Form(""),
    jugador: str = Form(""),
    talla: str = Form(""),
    origen: str = Form(""),
    adquirido: str = Form(""),
    comprador: str = Form(""),
    categoria: str = Form("club"),
    liga: str = Form(""),
    ciudad: str = Form(""),
    pais: str = Form(""),
    autenticidad: str = Form(""),
    historia: str = Form(""),
) -> ItemForm:
    return ItemForm(
        tipo=tipo,
        club=club,
        temporada=temporada,
        jugador=jugador,
        talla=talla,
        origen=origen,
        adquirido=adquirido,
        comprador=comprador,
        categoria=categoria,
        liga=liga,
        ciudad=ciudad,
        pais=pais,
        autenticidad=autenticidad,
        historia=historia,
    )


def read_items():
    with lock:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def write_items(items):
    with lock:
        DATA_FILE.write_text(
            json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8"
        )


def save_photo(file: UploadFile) -> str:
    raw = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="La foto supera el tamaño máximo permitido (15 MB)")

    filename = f"{uuid.uuid4().hex}.jpg"
    dest = UPLOADS_DIR / filename
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida")

    img = img.convert("RGB")
    max_w = 1400
    if img.width > max_w:
        ratio = max_w / img.width
        img = img.resize((max_w, int(img.height * ratio)))
    img.save(dest, "JPEG", quality=85)
    return filename


def delete_photo(filename: Optional[str]):
    if not filename:
        return
    path = UPLOADS_DIR / filename
    if path.exists():
        path.unlink()


def save_if_present(file: Optional[UploadFile]) -> Optional[str]:
    return save_photo(file) if (file and file.filename) else None


@app.get("/")
def serve_index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/items", response_model=list[Item])
def list_items():
    items = read_items()
    items.sort(key=lambda i: i.get("createdAt", ""), reverse=True)
    return items


@app.post("/api/items", response_model=Item)
def create_item(
    form: ItemForm = Depends(item_form),
    foto_principal: Optional[UploadFile] = File(None),
    foto_frente: Optional[UploadFile] = File(None),
    foto_trasera: Optional[UploadFile] = File(None),
):
    items = read_items()
    item = {
        "id": uuid.uuid4().hex,
        **form.model_dump(),
        "fotos": {
            "principal": save_if_present(foto_principal),
            "frente": save_if_present(foto_frente),
            "trasera": save_if_present(foto_trasera),
        },
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    items.append(item)
    write_items(items)
    return item


@app.put("/api/items/{item_id}", response_model=Item)
def update_item(
    item_id: str,
    form: ItemForm = Depends(item_form),
    foto_principal: Optional[UploadFile] = File(None),
    foto_frente: Optional[UploadFile] = File(None),
    foto_trasera: Optional[UploadFile] = File(None),
):
    items = read_items()
    idx = next((i for i, it in enumerate(items) if it["id"] == item_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Pieza no encontrada")

    existing = items[idx]
    fotos = dict(existing.get("fotos") or {})

    for key, upload in (
        ("principal", foto_principal),
        ("frente", foto_frente),
        ("trasera", foto_trasera),
    ):
        if upload and upload.filename:
            delete_photo(fotos.get(key))
            fotos[key] = save_photo(upload)

    updated = {
        **existing,
        **form.model_dump(),
        "fotos": fotos,
    }
    items[idx] = updated
    write_items(items)
    return updated


@app.delete("/api/items/{item_id}")
def delete_item(item_id: str):
    items = read_items()
    idx = next((i for i, it in enumerate(items) if it["id"] == item_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Pieza no encontrada")
    fotos = items[idx].get("fotos") or {}
    for filename in fotos.values():
        delete_photo(filename)
    items.pop(idx)
    write_items(items)
    return {"ok": True}
