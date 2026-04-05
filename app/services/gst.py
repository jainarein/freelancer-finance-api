from decimal import Decimal

GST_RATE = Decimal("18.00")       # Standard GST rate in India
GST_THRESHOLD = Decimal("20.00")  # Lakh rupees — registration threshold

def calculate_gst(base_amount: Decimal, is_gst_registered: bool) -> dict:
    """
    Calculate GST for an invoice.
    Only GST-registered freelancers charge GST.
    """
    base = Decimal(str(base_amount))

    if not is_gst_registered:
        return {
            "gst_rate": Decimal("0.00"),
            "gst_amount": Decimal("0.00"),
            "total_amount": base,
            "is_gst_applicable": False,
        }

    gst_amount = (base * GST_RATE / 100).quantize(Decimal("0.01"))
    total = base + gst_amount

    return {
        "gst_rate": GST_RATE,
        "gst_amount": gst_amount,
        "total_amount": total,
        "is_gst_applicable": True,
    }


def generate_invoice_number(user_id: str, count: int) -> str:
    """
    Generate a unique invoice number.
    Format: INV-{first8ofuserid}-{count:04d}
    Example: INV-A1B2C3D4-0001
    """
    short_id = user_id.replace("-", "")[:8].upper()
    return f"INV-{short_id}-{count:04d}"


def check_gst_registration_needed(annual_income: Decimal) -> dict:
    """
    Check if freelancer needs to register for GST.
    Threshold: ₹20 lakh for services in India.
    """
    threshold_paise = GST_THRESHOLD * 100000  # convert lakh to rupees
    needs_registration = annual_income >= threshold_paise

    return {
        "annual_income": annual_income,
        "threshold": threshold_paise,
        "needs_registration": needs_registration,
        "message": (
            "You must register for GST as your income exceeds ₹20 lakhs"
            if needs_registration
            else f"GST registration not required yet. "
                 f"₹{threshold_paise - annual_income:,.2f} away from threshold"
        )
    }
