from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime
from bson import ObjectId
from database import get_collection
from auth import get_current_user  # Changed this line
from pydantic import BaseModel

# ... rest of your code


router = APIRouter(prefix="/expenses", tags=["Expenses"])

class ExpenseCreate(BaseModel):
    trip_id: str
    category: str
    amount: float
    description: str
    date: str

class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[str] = None

@router.get("/trip/{trip_id}")
async def get_trip_expenses(
    trip_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Get all expenses for a specific trip"""
    # First verify the trip belongs to the user
    trips_collection = get_collection("trips")
    try:
        trip = await trips_collection.find_one({
            "_id": ObjectId(trip_id),
            "user_id": current_user_id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Get expenses
    expenses_collection = get_collection("expenses")
    cursor = expenses_collection.find({"trip_id": trip_id}).sort("date", -1)
    expenses = await cursor.to_list(length=None)
    
    for expense in expenses:
        expense["_id"] = str(expense["_id"])
    
    # Calculate total
    total = sum(expense["amount"] for expense in expenses)
    
    return {
        "trip_id": trip_id,
        "total": total,
        "expenses": expenses
    }

@router.post("/")
async def create_expense(
    expense_data: ExpenseCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a new expense"""
    # Verify trip ownership
    trips_collection = get_collection("trips")
    try:
        trip = await trips_collection.find_one({
            "_id": ObjectId(expense_data.trip_id),
            "user_id": current_user_id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Create expense
    expenses_collection = get_collection("expenses")
    expense = {
        "trip_id": expense_data.trip_id,
        "category": expense_data.category,
        "amount": expense_data.amount,
        "description": expense_data.description,
        "date": expense_data.date,
        "created_at": datetime.utcnow()
    }
    
    result = await expenses_collection.insert_one(expense)
    expense["_id"] = str(result.inserted_id)
    
    return expense

@router.put("/{expense_id}")
async def update_expense(
    expense_id: str,
    expense_data: ExpenseUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update an expense"""
    expenses_collection = get_collection("expenses")
    
    # First get the expense to verify trip ownership
    try:
        expense = await expenses_collection.find_one({"_id": ObjectId(expense_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid expense ID")
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Verify trip ownership
    trips_collection = get_collection("trips")
    trip = await trips_collection.find_one({
        "_id": ObjectId(expense["trip_id"]),
        "user_id": current_user_id
    })
    
    if not trip:
        raise HTTPException(status_code=403, detail="Not authorized to modify this expense")
    
    # Update expense
    update_data = {k: v for k, v in expense_data.dict().items() if v is not None}
    
    if update_data:
        await expenses_collection.update_one(
            {"_id": ObjectId(expense_id)},
            {"$set": update_data}
        )
    
    return {"message": "Expense updated successfully"}

@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Delete an expense"""
    expenses_collection = get_collection("expenses")
    
    # Get expense to verify ownership
    try:
        expense = await expenses_collection.find_one({"_id": ObjectId(expense_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid expense ID")
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Verify trip ownership
    trips_collection = get_collection("trips")
    trip = await trips_collection.find_one({
        "_id": ObjectId(expense["trip_id"]),
        "user_id": current_user_id
    })
    
    if not trip:
        raise HTTPException(status_code=403, detail="Not authorized to delete this expense")
    
    # Delete expense
    await expenses_collection.delete_one({"_id": ObjectId(expense_id)})
    
    return {"message": "Expense deleted successfully"}