import { Link } from "react-router-dom";
import { CircleHelp, Truck, CreditCard, RotateCcw, PackageCheck } from "lucide-react";

function Question({ q, children, open = false }) {
  return (
    <details className="border-t border-slate-100 py-4" open={open}>
      <summary className="cursor-pointer text-sm font-bold text-secondary">{q}</summary>
      <div className="mt-3 text-sm leading-7 text-slate-500">{children}</div>
    </details>
  );
}

function Section({ id, icon: Icon, title, children }) {
  return (
    <section id={id} className="card scroll-mt-28 p-5" aria-labelledby={`${id}-title`}>
      <div className="mb-4 flex items-center gap-3">
        <Icon className="text-primary-500" aria-hidden="true" />
        <h2 id={`${id}-title`} className="font-extrabold text-secondary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-surface py-8">
      <div className="container-page">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-600"><CircleHelp size={28} aria-hidden="true" /></span>
          <p className="eyebrow mt-5">Help center</p>
          <h1 className="mt-2 text-3xl font-black text-secondary sm:text-4xl">Frequently asked questions</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">Find quick answers to common questions about shopping, payment, delivery, and returns.</p>
        </div>
        <div className="mx-auto max-w-3xl space-y-4">
          <Section id="shipping" icon={Truck} title="Shipping & delivery">
            <Question q="How much does shipping cost?" open>
              Shipping is free on every order, with no minimum basket.
            </Question>
            <Question q="How long does delivery take?">
              Delivery times depend on your location and the product. After you order, we contact you on the phone number you gave to arrange delivery.
            </Question>
            <Question q="Can I track my order?">
              Yes. Sign in and open <Link to="/orders" className="font-bold text-primary-600">My orders</Link> to see the status of each order: placed, confirmed, processing, shipped and delivered.
            </Question>
          </Section>
          <Section id="payments" icon={CreditCard} title="Payments">
            <Question q="Which payment methods are available?" open>
              You pay in cash when your order is delivered (cash on delivery). Card payments are not available yet.
            </Question>
            <Question q="Can I use a coupon code?">
              Yes. Enter it in the coupon field at checkout; the discount is checked and applied before you place the order.
            </Question>
            <Question q="Is my information safe?">
              The site uses an encrypted connection, and because you pay on delivery we never ask for your card details.
            </Question>
          </Section>
          <Section id="returns" icon={RotateCcw} title="Returns & refunds">
            <Question q="How do I request a return?" open>
              <Link to="/contact" className="font-bold text-primary-600">Contact our support team</Link> with your order number and the reason for the return, and we&apos;ll explain the next steps.
            </Question>
            <Question q="When will I receive my refund?">
              Our support team confirms the timing once your return has been checked.
            </Question>
          </Section>
          <Section id="orders" icon={PackageCheck} title="Products & orders">
            <Question q="Can I change or cancel an order?">
              You can cancel an order yourself from <Link to="/orders" className="font-bold text-primary-600">My orders</Link> while it is still pending or confirmed. For changes, contact support as soon as possible: changes may not be possible once an order is being prepared or has shipped.
            </Question>
          </Section>
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">Still need help? <Link to="/contact" className="font-bold text-primary-600">Contact our team</Link></p>
      </div>
    </main>
  );
}
