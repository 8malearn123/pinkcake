import { ShieldCheck } from 'lucide-react';
import { InfoPageLayout } from '@/components/store/InfoPageLayout';

export default function Privacy() {
  return (
    <InfoPageLayout
      eyebrow="خصوصيتك تهمنا"
      title="سياسة الخصوصية"
      subtitle="آخر تحديث: يونيو 2026"
      icon={ShieldCheck}
    >
      <div className="max-w-3xl space-y-8">
        <p className="text-muted-foreground leading-relaxed">
          في بينك كيك نولي خصوصيتكِ أهمية كبيرة. توضّح هذه السياسة أنواع البيانات التي نجمعها وكيفية
          استخدامها وحمايتها، إضافة إلى حقوقكِ المتعلقة بها. باستخدامكِ لموقعنا فإنكِ توافقين على
          الممارسات الموضّحة أدناه.
        </p>

        <section>
          <h2 className="font-display text-2xl mb-2">١. البيانات التي نجمعها</h2>
          <p className="text-muted-foreground leading-relaxed">
            نجمع البيانات اللازمة لتقديم خدماتنا وتحسين تجربتكِ، وتشمل:
          </p>
          <ul className="list-disc ps-5 mt-3 space-y-1 text-muted-foreground leading-relaxed">
            <li>بيانات التواصل مثل الاسم ورقم الجوال والبريد الإلكتروني.</li>
            <li>عنوان التوصيل والمعلومات اللازمة لإتمام الطلب.</li>
            <li>تفاصيل طلباتكِ وتفضيلاتكِ السابقة.</li>
            <li>بيانات تقنية مثل نوع المتصفّح وعنوان الـ IP عند تصفّح الموقع.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-2">٢. كيف نستخدم بياناتك</h2>
          <p className="text-muted-foreground leading-relaxed">
            نستخدم بياناتكِ لمعالجة طلباتكِ وتوصيلها، والتواصل معكِ بخصوص حالة الطلب، والرد على
            استفساراتكِ، وتحسين خدماتنا ومنتجاتنا. وقد نرسل لكِ تحديثات أو عروضاً ترويجية في حال
            موافقتكِ على ذلك، ويمكنكِ إلغاء الاشتراك في أي وقت.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-2">٣. ملفات تعريف الارتباط (الكوكيز)</h2>
          <p className="text-muted-foreground leading-relaxed">
            يستخدم موقعنا ملفات تعريف الارتباط لتحسين تجربة التصفّح وتذكّر تفضيلاتكِ وتحليل أداء
            الموقع. يمكنكِ التحكّم في هذه الملفات أو تعطيلها من إعدادات متصفّحكِ، مع العلم أن تعطيل
            بعضها قد يؤثر على بعض وظائف الموقع.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-2">٤. مشاركة البيانات مع أطراف ثالثة</h2>
          <p className="text-muted-foreground leading-relaxed">
            نحن لا نبيع بياناتكِ الشخصية لأي جهة. وقد نشاركها فقط مع شركاء موثوقين بالقدر اللازم
            لتقديم الخدمة، مثل:
          </p>
          <ul className="list-disc ps-5 mt-3 space-y-1 text-muted-foreground leading-relaxed">
            <li>مزوّدي خدمات التوصيل لإيصال طلباتكِ إلى عنوانكِ.</li>
            <li>بوابات الدفع المعتمدة لمعالجة عمليات الدفع بشكل آمن.</li>
            <li>الجهات الحكومية المختصة عند وجود التزام نظامي يقتضي ذلك.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-2">٥. حماية البيانات</h2>
          <p className="text-muted-foreground leading-relaxed">
            نطبّق إجراءات تقنية وتنظيمية مناسبة لحماية بياناتكِ من الوصول غير المصرّح به أو الفقدان أو
            إساءة الاستخدام، وتشمل تشفير الاتصالات وتقييد الوصول للبيانات. ومع حرصنا الدائم، لا يمكن
            ضمان أمان مطلق لأي بيانات تُرسَل عبر الإنترنت.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-2">٦. حقوقك</h2>
          <p className="text-muted-foreground leading-relaxed">
            يحق لكِ الاطلاع على بياناتكِ الشخصية التي نحتفظ بها، وطلب تصحيحها أو تحديثها أو حذفها،
            إضافة إلى سحب موافقتكِ على معالجتها لأغراض تسويقية في أي وقت. لممارسة أي من هذه الحقوق،
            يكفي التواصل معنا عبر القنوات الموضّحة أدناه.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-2">٧. التواصل معنا بخصوص الخصوصية</h2>
          <p className="text-muted-foreground leading-relaxed">
            إذا كان لديكِ أي استفسار أو ملاحظة حول سياسة الخصوصية أو طريقة تعاملنا مع بياناتكِ، يسعدنا
            تواصلكِ معنا عبر البريد الإلكتروني hello@pinkcake.sa أو من خلال صفحة «تواصلي معنا»، وسنردّ
            على طلبكِ في أقرب وقت.
          </p>
        </section>
      </div>
    </InfoPageLayout>
  );
}
