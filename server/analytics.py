import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sqlite3
from typing import Dict, List, Any

def connect_db():
    return sqlite3.connect('finsight.db')

def analyze_spending_patterns(user_id: str) -> Dict[str, Any]:
    """Analyze spending patterns and generate insights"""
    conn = connect_db()
    
    # Get user transactions
    query = """
    SELECT * FROM transactions 
    WHERE user_id = ? AND type = 'expense'
    ORDER BY date DESC
    """
    
    df = pd.read_sql_query(query, conn, params=(user_id,))
    conn.close()
    
    if df.empty:
        return {"insights": [], "category_analysis": {}, "trends": {}}
    
    # Convert date column
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.to_period('M')
    
    # Category analysis
    category_totals = df.groupby('category')['amount'].sum().to_dict()
    category_avg = df.groupby('category')['amount'].mean().to_dict()
    
    # Monthly trends
    monthly_spending = df.groupby('month')['amount'].sum()
    
    # Calculate insights
    insights = []
    
    # Top spending category
    top_category = max(category_totals.items(), key=lambda x: x[1])
    insights.append({
        "type": "top_category",
        "message": f"Your highest spending category is {top_category[0]} with ${top_category[1]:.2f} total",
        "category": top_category[0],
        "amount": top_category[1]
    })
    
    # Month-over-month change
    if len(monthly_spending) >= 2:
        current_month = monthly_spending.iloc[-1]
        previous_month = monthly_spending.iloc[-2]
        change_pct = ((current_month - previous_month) / previous_month) * 100
        
        insights.append({
            "type": "monthly_change",
            "message": f"Your spending {'increased' if change_pct > 0 else 'decreased'} by {abs(change_pct):.1f}% this month",
            "change_percent": change_pct,
            "current_amount": float(current_month),
            "previous_amount": float(previous_month)
        })
    
    return {
        "insights": insights,
        "category_analysis": category_totals,
        "monthly_trends": monthly_spending.to_dict(),
        "category_averages": category_avg
    }

def generate_savings_tips(user_id: str) -> List[Dict[str, Any]]:
    """Generate personalized savings tips using spending analysis"""
    conn = connect_db()
    
    # Get recent transactions (last 3 months)
    three_months_ago = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
    
    query = """
    SELECT * FROM transactions 
    WHERE user_id = ? AND type = 'expense' AND date >= ?
    ORDER BY date DESC
    """
    
    df = pd.read_sql_query(query, conn, params=(user_id, three_months_ago))
    conn.close()
    
    tips = []
    
    if df.empty:
        return tips
    
    # Analyze spending by category
    category_spending = df.groupby('category')['amount'].agg(['sum', 'count', 'mean'])
    
    # Dining out analysis
    if 'Food & Dining' in category_spending.index:
        dining_total = category_spending.loc['Food & Dining', 'sum']
        dining_count = category_spending.loc['Food & Dining', 'count']
        dining_avg = category_spending.loc['Food & Dining', 'mean']
        
        if dining_total > 300:  # If spending more than $300/month on dining
            potential_savings = dining_total * 0.3  # 30% reduction
            tips.append({
                "category": "Food & Dining",
                "recommendation": f"You spent ${dining_total:.2f} on dining out. Consider cooking at home {min(dining_count // 2, 10)} more times per month.",
                "potential_savings": float(potential_savings),
                "confidence": 0.85
            })
    
    # Subscription analysis
    subscription_keywords = ['netflix', 'spotify', 'subscription', 'streaming', 'premium', 'pro']
    subscription_transactions = df[df['description'].str.lower().str.contains('|'.join(subscription_keywords), na=False)]
    
    if not subscription_transactions.empty:
        subscription_total = subscription_transactions['amount'].sum()
        if subscription_total > 50:  # More than $50 in subscriptions
            tips.append({
                "category": "Subscriptions",
                "recommendation": f"You have ${subscription_total:.2f} in subscription services. Review and cancel unused subscriptions.",
                "potential_savings": float(subscription_total * 0.4),  # 40% potential savings
                "confidence": 0.75
            })
    
    # Transportation analysis
    if 'Transportation' in category_spending.index:
        transport_total = category_spending.loc['Transportation', 'sum']
        if transport_total > 200:  # More than $200/month
            potential_savings = transport_total * 0.25
            tips.append({
                "category": "Transportation",
                "recommendation": f"Consider using public transport or carpooling to reduce your ${transport_total:.2f} monthly transportation costs.",
                "potential_savings": float(potential_savings),
                "confidence": 0.70
            })
    
    return tips

def categorize_transaction(description: str, amount: float) -> str:
    """Auto-categorize transactions based on description"""
    description_lower = description.lower()
    
    # Define category keywords
    categories = {
        'Food & Dining': ['restaurant', 'cafe', 'starbucks', 'mcdonald', 'pizza', 'food', 'dining', 'grocery', 'supermarket'],
        'Transportation': ['uber', 'lyft', 'gas', 'fuel', 'parking', 'taxi', 'metro', 'bus', 'train'],
        'Shopping': ['amazon', 'walmart', 'target', 'shopping', 'store', 'retail', 'purchase'],
        'Bills & Utilities': ['electric', 'water', 'internet', 'phone', 'utility', 'bill', 'payment'],
        'Entertainment': ['movie', 'theater', 'netflix', 'spotify', 'game', 'entertainment'],
        'Healthcare': ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'clinic'],
        'Education': ['tuition', 'book', 'school', 'education', 'course', 'class']
    }
    
    for category, keywords in categories.items():
        if any(keyword in description_lower for keyword in keywords):
            return category
    
    return 'Other'

def process_csv_transactions(csv_data: str, user_id: str) -> Dict[str, Any]:
    """Process CSV data and return categorized transactions"""
    try:
        # Parse CSV data
        from io import StringIO
        df = pd.read_csv(StringIO(csv_data))
        
        # Standardize column names (handle different bank formats)
        column_mapping = {
            'description': ['description', 'memo', 'transaction', 'details'],
            'amount': ['amount', 'debit', 'credit', 'value'],
            'date': ['date', 'transaction_date', 'posted_date']
        }
        
        # Find matching columns
        for standard_col, possible_cols in column_mapping.items():
            for col in df.columns:
                if col.lower() in possible_cols:
                    df = df.rename(columns={col: standard_col})
                    break
        
        # Process transactions
        results = {
            'total_transactions': len(df),
            'processed_transactions': 0,
            'categories': {},
            'insights': []
        }
        
        for _, row in df.iterrows():
            try:
                description = str(row.get('description', 'Unknown'))
                amount = float(row.get('amount', 0))
                date_str = str(row.get('date', datetime.now().strftime('%Y-%m-%d')))
                
                # Determine transaction type
                transaction_type = 'expense' if amount > 0 else 'income'
                amount = abs(amount)
                
                # Auto-categorize
                category = categorize_transaction(description, amount)
                
                # Update statistics
                results['processed_transactions'] += 1
                if category not in results['categories']:
                    results['categories'][category] = 0
                results['categories'][category] += 1
                
            except Exception as e:
                continue
        
        # Generate processing insights
        if results['categories']:
            top_category = max(results['categories'].items(), key=lambda x: x[1])
            results['insights'].append(f"Most common category: {top_category[0]} ({top_category[1]} transactions)")
        
        return results
        
    except Exception as e:
        return {"error": f"Failed to process CSV: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)
    
    action = sys.argv[1]
    user_id = sys.argv[2]
    
    try:
        if action == "analyze_spending":
            result = analyze_spending_patterns(user_id)
        elif action == "generate_tips":
            result = generate_savings_tips(user_id)
        elif action == "process_csv":
            csv_data = sys.argv[3] if len(sys.argv) > 3 else ""
            result = process_csv_transactions(csv_data, user_id)
        else:
            result = {"error": "Unknown action"}
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
