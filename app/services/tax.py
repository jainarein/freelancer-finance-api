from decimal import Decimal

# Indian tax slabs FY 2024-25 (New Regime)
TAX_SLABS_NEW_REGIME = [
    (Decimal("300000"), Decimal("0")),      # 0-3L = 0%
    (Decimal("600000"), Decimal("5")),      # 3-6L = 5%
    (Decimal("900000"), Decimal("10")),     # 6-9L = 10%
    (Decimal("1200000"), Decimal("15")),    # 9-12L = 15%
    (Decimal("1500000"), Decimal("20")),    # 12-15L = 20%
    (Decimal("99999999"), Decimal("30")),   # 15L+ = 30%
]

SECTION_44ADA_THRESHOLD = Decimal("7500000")  # ₹75 lakhs
PRESUMPTIVE_PROFIT_RATE = Decimal("50")        # 50% of gross income
STANDARD_DEDUCTION = Decimal("50000")          # ₹50,000 standard deduction

def calculate_tax_on_income(taxable_income: Decimal) -> Decimal:
    """Calculate income tax using new regime slabs"""
    tax = Decimal("0")
    previous_slab = Decimal("0")

    for slab_limit, rate in TAX_SLABS_NEW_REGIME:
        if taxable_income <= previous_slab:
            break
        slab_income = min(taxable_income, slab_limit) - previous_slab
        tax += slab_income * rate / 100
        previous_slab = slab_limit

    # Add 4% health and education cess
    cess = tax * Decimal("4") / 100
    return (tax + cess).quantize(Decimal("0.01"))


def calculate_44ada(gross_income: Decimal) -> dict:
    """
    Section 44ADA — Presumptive taxation for professionals.
    Eligible if gross receipts <= ₹75 lakhs.
    Only 50% of income is taxable as profit.
    """
    is_eligible = gross_income <= SECTION_44ADA_THRESHOLD

    if not is_eligible:
        return {
            "is_eligible": False,
            "gross_income": gross_income,
            "message": "Income exceeds ₹75L — not eligible for 44ADA",
            "taxable_income": gross_income,
            "estimated_tax": calculate_tax_on_income(
                max(gross_income - STANDARD_DEDUCTION, Decimal("0"))
            ),
            "presumptive_tax": None,
            "tax_saving": Decimal("0"),
        }

    # Under 44ADA — only 50% is taxable
    presumptive_income = gross_income * PRESUMPTIVE_PROFIT_RATE / 100
    taxable_income = max(
        presumptive_income - STANDARD_DEDUCTION,
        Decimal("0")
    )

    # Tax on full income (without 44ADA)
    normal_taxable = max(gross_income - STANDARD_DEDUCTION, Decimal("0"))
    normal_tax = calculate_tax_on_income(normal_taxable)

    # Tax under 44ADA
    presumptive_tax = calculate_tax_on_income(taxable_income)
    tax_saving = normal_tax - presumptive_tax

    return {
        "is_eligible": True,
        "gross_income": gross_income,
        "presumptive_income": presumptive_income,
        "taxable_income": taxable_income,
        "normal_tax": normal_tax,
        "presumptive_tax": presumptive_tax,
        "tax_saving": tax_saving,
        "message": (
            f"You qualify for Section 44ADA! "
            f"Save ₹{tax_saving:,.2f} by declaring 50% as profit"
        ),
    }


def calculate_advance_tax(estimated_annual_tax: Decimal) -> dict:
    """
    Advance tax schedule for freelancers.
    Due if tax liability > ₹10,000/year.
    """
    if estimated_annual_tax <= Decimal("10000"):
        return {
            "required": False,
            "message": "Advance tax not required (liability under ₹10,000)"
        }

    return {
        "required": True,
        "installments": [
            {
                "due_date": "15th June",
                "percentage": "15%",
                "amount": (estimated_annual_tax * Decimal("15") / 100).quantize(Decimal("0.01"))
            },
            {
                "due_date": "15th September",
                "percentage": "45%",
                "amount": (estimated_annual_tax * Decimal("45") / 100).quantize(Decimal("0.01"))
            },
            {
                "due_date": "15th December",
                "percentage": "75%",
                "amount": (estimated_annual_tax * Decimal("75") / 100).quantize(Decimal("0.01"))
            },
            {
                "due_date": "15th March",
                "percentage": "100%",
                "amount": estimated_annual_tax
            },
        ]
    }


def calculate_safe_to_spend(
    total_received: Decimal,
    gst_collected: Decimal,
    advance_tax: Decimal,
    total_expenses: Decimal,
) -> dict:
    """
    Safe-to-spend = what you can actually spend without financial risk.
    Formula: Total Received - GST Due - Advance Tax Reserve - Fixed Expenses
    """
    safe_amount = total_received - gst_collected - advance_tax - total_expenses
    return {
        "total_received": total_received,
        "gst_due": gst_collected,
        "advance_tax_reserve": advance_tax,
        "total_expenses": total_expenses,
        "safe_to_spend": max(safe_amount, Decimal("0")),
        "is_deficit": safe_amount < 0,
        "deficit_amount": abs(min(safe_amount, Decimal("0"))),
    }