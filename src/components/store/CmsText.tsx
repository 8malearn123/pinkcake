import { Fragment, type ReactNode } from 'react';
import { RiyalSymbol } from '@/components/ui/riyal';

/**
 * نصّ قادم من لوحة إدارة الصفحة الرئيسية، مع نائبَين:
 *
 * - `{riyal}` → رمز الريال الرسمي (SVG). لازم لأن قاعدة المشروع أن الرمز يُرسم
 *   لا يُكتب حرفاً، والمحتوى المُحرَّر نصّ صِرف لا يستطيع حمل JSX.
 * - أي `{اسم}` آخر يُستبدل من `vars` (اسم المتجر مثلاً)، ويُترك كما هو إن لم
 *   يُعرَّف — نائب غير معروف يظهر ظاهراً كي يُلاحَظ ويُصحَّح، لا يُمحى بصمت.
 */
export function CmsText({
  value,
  vars,
  riyalClassName = 'text-[0.9em]',
}: {
  value: string;
  vars?: Record<string, string>;
  riyalClassName?: string;
}): ReactNode {
  const substitute = (text: string) =>
    vars ? text.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match) : text;

  if (!value.includes('{riyal}')) return substitute(value);

  return value.split(/(\{riyal\})/g).map((part, i) =>
    part === '{riyal}' ? (
      <RiyalSymbol key={i} className={riyalClassName} />
    ) : (
      <Fragment key={i}>{substitute(part)}</Fragment>
    ),
  );
}
