from __future__ import annotations

import asyncio
import os
import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional

import uvicorn
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from solver import Solver


keys = {
    "2ae66f90b7788ab8950e8f81b829c947", # just put api keys
}

class Task(BaseModel):
    url: str 
    sitekey: str 
    action: str 
    enterprise: bool = False
    proxy: Optional[str]
    timeout: Optional[float] = None


class Solved(BaseModel):
    success: bool
    token: Optional[str] = None
    error: Optional[str] = None
    elapsed: float


class Task(BaseModel):
    task_id: str


class Status(BaseModel):
    task_id: str
    state: str
    token: Optional[str] = None
    error: Optional[str] = None
    elapsed: Optional[float] = None

_state: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    _state['sem'] = asyncio.Semaphore(5)
    _state['tasks'] = {}
    yield
    _state.clear()

app = FastAPI(title='Autopia', version='1.0.0', lifespan=lifespan)

def _auth(auth: Optional[str]) -> None:
    if not keys:
        return
    if not auth or not auth.lower().startswith('bearer '):
        raise HTTPException(status_code=401, detail='Missing bearer key')
    if auth.split(None, 1)[1].strip() not in keys:
        raise HTTPException(status_code=403, detail='Invalid key')

async def _run(req: Task) -> tuple[Optional[str], Optional[str], float]:
    start = time.monotonic()
    timeout = req.timeout or 20
    try:
        async with _state['sem']:
            solver = Solver(proxy=req.proxy, headless=False)
            token = await asyncio.wait_for(
                solver.asolve(req.url, req.sitekey, req.action, req.enterprise),
                timeout=timeout,
            )
            return token, None, round(time.monotonic() - start, 2)
    except asyncio.TimeoutError:
        return None, f'Timed out : {timeout}s', round(time.monotonic() - start, 2)
    except Exception as e:
        return None, f'Error : {e}', round(time.monotonic() - start, 2)


@app.post('/solve', response_model=Solved)
async def solve(req: Task, auth: Optional[str] = Header(default=None)):
    _auth(auth)
    token, error, elapsed = await _run(req)
    return Solved(success=token is not None, token=token, error=error, elapsed=elapsed)


@app.post('/tasks', response_model=Task)
async def newTask(req: Task, auth: Optional[str] = Header(default=None)):
    _auth(auth)
    task_id = uuid.uuid4().hex
    _state['tasks'][task_id] = {'state': 'pending', 'token': None, 'error': None, 'elapsed': None}

    async def worker():
        _state['tasks'][task_id]['state'] = 'running'
        token, error, elapsed = await _run(req)
        _state['tasks'][task_id] = {
            'state': 'done' if token else 'error',
            'token': token,
            'error': error,
            'elapsed': elapsed,
        }

    asyncio.create_task(worker())
    return Task(task_id=task_id)


@app.get('/tasks/{task_id}', response_model=Status)
async def getTask(task_id: str, auth: Optional[str] = Header(default=None)):
    _auth(auth)
    task = _state['tasks'].get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail='Task not found')
    return Status(task_id=task_id, **task)


@app.delete('/tasks/{task_id}')
async def deleteTask(task_id: str, auth: Optional[str] = Header(default=None)):
    _auth(auth)
    _state['tasks'].pop(task_id, None)
    return {'deleted': task_id}

if __name__ == '__main__':
    uvicorn.run(
        'server:app',
        host='0.0.0.0',
        port=8778,
        log_level='info'
    )
