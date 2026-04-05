from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import date, timedelta
from decimal import Decimal
from app.database import SessionLocal
from app.models.invoice import Invoice, InvoiceStatus
from app.models.user import User
from app.services.tax import calculate_44ada

scheduler = BackgroundScheduler()

def get_db() -> Session:
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise


def check_overdue_invoices():
    """
    Runs daily at midnight.
    Auto-marks invoices as overdue if due_date has passed.
    """
    print("Running job: check_overdue_invoices")
    db = get_db()
    try:
        today = date.today()
        invoices = db.query(Invoice).filter(
            Invoice.due_date < today,
            Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.DRAFT])
        ).all()

        count = 0
        for invoice in invoices:
            invoice.status = InvoiceStatus.OVERDUE
            count += 1

        db.commit()
        print(f"Marked {count} invoices as overdue")
    except Exception as e:
        print(f"Error in check_overdue_invoices: {e}")
        db.rollback()
    finally:
        db.close()


def send_gst_filing_reminder():
    """
    Runs on 15th of every month.
    Reminds GST-registered freelancers to file returns.
    """
    print("Running job: send_gst_filing_reminder")
    db = get_db()
    try:
        gst_users = db.query(User).filter(
            User.is_gst_registered == True,
            User.is_active == True
        ).all()

        for user in gst_users:
            # In production: send email here
            print(f"GST reminder → {user.email}: File GSTR-1 by 11th, GSTR-3B by 20th")

        print(f"Sent GST reminders to {len(gst_users)} users")
    except Exception as e:
        print(f"Error in send_gst_filing_reminder: {e}")
    finally:
        db.close()


def send_advance_tax_reminder():
    """
    Runs on advance tax due dates:
    June 15, Sep 15, Dec 15, Mar 15
    """
    print("Running job: send_advance_tax_reminder")
    db = get_db()
    try:
        users = db.query(User).filter(User.is_active == True).all()

        for user in users:
            paid_invoices = [
                i for i in user.invoices
                if i.status == InvoiceStatus.PAID
            ]
            if not paid_invoices:
                continue

            gross_income = Decimal(str(sum(i.base_amount for i in paid_invoices)))
            result = calculate_44ada(gross_income)
            tax = result.get("presumptive_tax") or result.get("estimated_tax") or Decimal("0")

            if tax > Decimal("10000"):
                installment = (tax * Decimal("15") / 100).quantize(Decimal("0.01"))
                print(f"Advance tax reminder → {user.email}: Pay ₹{installment} by 15th")

        print(f"Advance tax reminders sent")
    except Exception as e:
        print(f"Error in send_advance_tax_reminder: {e}")
    finally:
        db.close()


def generate_monthly_summary():
    """
    Runs on 1st of every month.
    Prints monthly financial summary for each user.
    """
    print("Running job: generate_monthly_summary")
    db = get_db()
    try:
        users = db.query(User).filter(User.is_active == True).all()

        for user in users:
            paid = [i for i in user.invoices if i.status == InvoiceStatus.PAID]
            total = sum(i.total_amount for i in paid)
            print(f"Monthly summary → {user.email}: ₹{total} received")

        print(f"Monthly summaries generated for {len(users)} users")
    except Exception as e:
        print(f"Error in generate_monthly_summary: {e}")
    finally:
        db.close()


def start_scheduler():
    """Register and start all background jobs"""

    # Daily at midnight — check overdue invoices
    scheduler.add_job(
        check_overdue_invoices,
        CronTrigger(hour=0, minute=0),
        id="check_overdue",
        replace_existing=True
    )

    # 15th of every month — GST reminder
    scheduler.add_job(
        send_gst_filing_reminder,
        CronTrigger(day=15, hour=9, minute=0),
        id="gst_reminder",
        replace_existing=True
    )

    # Advance tax dates — Jun 15, Sep 15, Dec 15, Mar 15
    for month in [6, 9, 12, 3]:
        scheduler.add_job(
            send_advance_tax_reminder,
            CronTrigger(month=month, day=15, hour=8, minute=0),
            id=f"advance_tax_{month}",
            replace_existing=True
        )

    # 1st of every month — monthly summary
    scheduler.add_job(
        generate_monthly_summary,
        CronTrigger(day=1, hour=7, minute=0),
        id="monthly_summary",
        replace_existing=True
    )

    scheduler.start()
    print("Scheduler started with jobs: overdue check, GST reminder, advance tax, monthly summary")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("Scheduler stopped")
