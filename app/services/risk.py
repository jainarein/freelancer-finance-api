from decimal import Decimal

def calculate_risk_score(
    total_invoices: int,
    paid_invoices: int,
    overdue_invoices: int,
    disputed_invoices: int,
    avg_payment_delay_days: int,
    total_billed: Decimal,
    total_paid: Decimal,
) -> dict:
    if total_invoices == 0:
        return {
            "risk_score": 0,
            "risk_label": "Unknown",
            "risk_color": "gray",
            "breakdown": {},
            "outstanding_amount": Decimal("0"),
            "payment_rate_pct": 0.0,
            "message": "No invoice history yet"
        }

    payment_rate = paid_invoices / total_invoices
    payment_risk = int((1 - payment_rate) * 40)
    overdue_rate = overdue_invoices / total_invoices
    overdue_risk = int(overdue_rate * 25)
    dispute_rate = disputed_invoices / total_invoices
    dispute_risk = int(dispute_rate * 20)
    delay_risk = min(int(avg_payment_delay_days / 2), 15)

    total_risk = min(payment_risk + overdue_risk + dispute_risk + delay_risk, 100)

    if total_risk <= 20:
        label, color = "Low", "green"
    elif total_risk <= 50:
        label, color = "Medium", "yellow"
    elif total_risk <= 75:
        label, color = "High", "orange"
    else:
        label, color = "Critical", "red"

    outstanding = total_billed - total_paid

    return {
        "risk_score": total_risk,
        "risk_label": label,
        "risk_color": color,
        "breakdown": {
            "payment_risk": payment_risk,
            "overdue_risk": overdue_risk,
            "dispute_risk": dispute_risk,
            "delay_risk": delay_risk,
        },
        "outstanding_amount": outstanding,
        "payment_rate_pct": round(payment_rate * 100, 1),
        "message": f"{label} risk client — {round(payment_rate * 100)}% payment rate, avg {avg_payment_delay_days} days delay"
    }


def calculate_health_score(
    total_invoices: int,
    paid_invoices: int,
    overdue_invoices: int,
    total_income: Decimal,
    total_expenses: Decimal,
    total_deductible: Decimal,
    is_gst_registered: bool,
    has_pan: bool,
    client_count: int,
    high_risk_clients: int,
) -> dict:
    score = 0
    breakdown = {}

    if total_invoices > 0:
        paid_rate = paid_invoices / total_invoices
        income_score = int(paid_rate * 25)
    else:
        income_score = 0
    score += income_score
    breakdown["income_consistency"] = income_score

    if total_income > 0:
        expense_ratio = total_expenses / total_income
        if expense_ratio < Decimal("0.3"):
            expense_score = 20
        elif expense_ratio < Decimal("0.5"):
            expense_score = 15
        elif expense_ratio < Decimal("0.7"):
            expense_score = 10
        else:
            expense_score = 5
    else:
        expense_score = 10
    score += expense_score
    breakdown["expense_management"] = expense_score

    tax_score = 0
    if has_pan:
        tax_score += 10
    if is_gst_registered:
        tax_score += 5
    if total_deductible > 0:
        tax_score += 5
    score += tax_score
    breakdown["tax_compliance"] = tax_score

    if client_count >= 5:
        diversity_score = 20
    elif client_count >= 3:
        diversity_score = 15
    elif client_count >= 2:
        diversity_score = 10
    elif client_count == 1:
        diversity_score = 5
    else:
        diversity_score = 0
    if high_risk_clients > 0:
        diversity_score = max(diversity_score - (high_risk_clients * 5), 0)
    score += diversity_score
    breakdown["client_diversity"] = diversity_score

    if total_invoices > 0:
        overdue_rate = overdue_invoices / total_invoices
        invoice_score = int((1 - overdue_rate) * 15)
    else:
        invoice_score = 0
    score += invoice_score
    breakdown["invoice_health"] = invoice_score

    score = min(score, 100)

    if score >= 80:
        label = "Excellent"
    elif score >= 60:
        label = "Good"
    elif score >= 40:
        label = "Fair"
    else:
        label = "Poor"

    tips = []
    if income_score < 15:
        tips.append("Follow up on unpaid invoices to improve payment rate")
    if expense_score < 10:
        tips.append("High expenses vs income — review and reduce non-essential costs")
    if not has_pan:
        tips.append("Add PAN number for tax compliance")
    if not is_gst_registered and total_income > Decimal("2000000"):
        tips.append("Consider GST registration — income approaching threshold")
    if client_count < 3:
        tips.append("Diversify client base — single client dependency is risky")
    if high_risk_clients > 0:
        tips.append(f"You have {high_risk_clients} high-risk client(s) — consider requiring advance payment")
    if overdue_invoices > 0:
        tips.append(f"{overdue_invoices} overdue invoice(s) — send payment reminders")

    return {
        "health_score": score,
        "health_label": label,
        "breakdown": breakdown,
        "tips": tips,
    }