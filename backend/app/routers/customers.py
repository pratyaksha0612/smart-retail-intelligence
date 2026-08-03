from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/customers",
    tags=["customers"]
)

@router.get("/", response_model=List[schemas.CustomerResponse])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    customers = db.query(models.Customer).offset(skip).limit(limit).all()
    return customers

@router.post("/", response_model=schemas.CustomerResponse)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    db_customer = models.Customer(name=customer.name)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer
