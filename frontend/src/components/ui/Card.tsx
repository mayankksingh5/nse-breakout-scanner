import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

/** Surface container used across the IPO dashboard. */
export function Card({ className = '', ...props }: DivProps) {
  return (
    <div
      className={
        'rounded-xl border border-slate-200 bg-white shadow-sm ' +
        'dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ' +
        className
      }
      {...props}
    />
  );
}

export function CardHeader({ className = '', ...props }: DivProps) {
  return <div className={'px-5 pt-5 ' + className} {...props} />;
}

export function CardBody({ className = '', ...props }: DivProps) {
  return <div className={'p-5 ' + className} {...props} />;
}

export function SectionTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={
        'text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ' +
        className
      }
      {...props}
    />
  );
}
