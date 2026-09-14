import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

type Locale = "ja" | "en" | "zh-cn" | "ko";

const localeConfig: Record<
  Locale,
  {
    path: string;
    noValue: string;
    subjectPrefix: string;
    autoReplySubject: string;
    autoReplyBody: (data: {
      name: string;
      email: string;
      sns: string;
      organization: string;
      purpose: string;
      message: string;
    }) => string;
  }
> = {
  ja: {
    path: "/contact/",
    noValue: "なし",
    subjectPrefix: "【お問い合わせ】",
    autoReplySubject: "お問い合わせありがとうございます｜錦乃",
    autoReplyBody: ({
      name,
      email,
      sns,
      organization,
      purpose,
      message
    }) => `${name} 様


この度はお問い合わせいただきありがとうございます。


以下の内容で受け付けいたしました。


--------------------


【お名前】

${name}


【メールアドレス】

${email}


【SNS・Webサイト】

${sns || "なし"}


【法人・団体名】

${organization || "なし"}


【ご相談内容】

${purpose}


【お問い合わせ内容】

${message}

--------------------


内容を確認後、
順次ご返信いたします。


数日経っても返信がない場合は、
迷惑メールフォルダもご確認ください。


錦乃

https://www.nishikinolab.net

contact@nishikinolab.net
`
  },

  en: {
    path: "/en/contact/",
    noValue: "None",
    subjectPrefix: "[Inquiry] ",
    autoReplySubject: "Thank You for Your Inquiry｜Nishikino",
    autoReplyBody: ({
      name,
      email,
      sns,
      organization,
      purpose,
      message
    }) => `${name},


Thank you very much for contacting me.


Your inquiry has been received with the following details.


--------------------


Name

${name}


Email Address

${email}


SNS / Website

${sns || "None"}


Company / Organization

${organization || "None"}


Purpose of Inquiry

${purpose}


Message

${message}

--------------------


I will review your inquiry and get back to you in due course.


If you do not receive a reply after several days,
please also check your spam or junk mail folder.


Nishikino

https://www.nishikinolab.net

contact@nishikinolab.net
`
  },

  "zh-cn": {
    path: "/zh-cn/contact/",
    noValue: "无",
    subjectPrefix: "【咨询】",
    autoReplySubject: "感谢您的咨询｜锦乃",
    autoReplyBody: ({
      name,
      email,
      sns,
      organization,
      purpose,
      message
    }) => `${name} 您好，


感谢您与我联系。


您的咨询已按以下内容成功提交。


--------------------


姓名

${name}


电子邮箱

${email}


社交媒体・网站

${sns || "无"}


企业・团体名称

${organization || "无"}


咨询事项

${purpose}


咨询内容

${message}

--------------------


我会确认您提交的内容，并依次回复。


如果数日后仍未收到回复，
也请您确认一下垃圾邮件文件夹。


锦乃

https://www.nishikinolab.net

contact@nishikinolab.net
`
  },

  ko: {
    path: "/ko/contact/",
    noValue: "없음",
    subjectPrefix: "【문의】",
    autoReplySubject: "문의해 주셔서 감사합니다｜錦乃니시키노",
    autoReplyBody: ({
      name,
      email,
      sns,
      organization,
      purpose,
      message
    }) => `${name} 님,


문의해 주셔서 진심으로 감사합니다.


아래 내용으로 문의가 접수되었습니다.


--------------------


이름

${name}


이메일 주소

${email}


SNS・웹사이트

${sns || "없음"}


법인・단체명

${organization || "없음"}


문의 내용

${purpose}


문의 내용 상세

${message}

--------------------


내용을 확인한 후 순차적으로 답변드리겠습니다.


며칠이 지나도 답변이 오지 않는 경우에는
스팸 메일함도 확인해 주세요.


錦乃니시키노

https://www.nishikinolab.net

contact@nishikinolab.net
`
  }
};


/*
 * --------------------
 * Locale Detection
 * --------------------
 *
 * The form itself submits to /api/contact for every language.
 * The language is therefore determined from the page that submitted
 * the form by checking the Referer URL.
 *
 * Japanese is used as the fallback when no valid localized path
 * can be detected.
 */

function detectLocale(request: Request): Locale {

  const referer = request.headers.get("referer") || "";

  try {

    const refererUrl = new URL(referer);
    const pathname = refererUrl.pathname;

    if (
      pathname === "/en/contact/" ||
      pathname.startsWith("/en/contact/")
    ) {
      return "en";
    }

    if (
      pathname === "/zh-cn/contact/" ||
      pathname.startsWith("/zh-cn/contact/")
    ) {
      return "zh-cn";
    }

    if (
      pathname === "/ko/contact/" ||
      pathname.startsWith("/ko/contact/")
    ) {
      return "ko";
    }

  } catch {
    // Fall back to Japanese below.
  }

  return "ja";
}


/*
 * --------------------
 * Other / Free Text
 * --------------------
 *
 * Each localized form uses a different visible value:
 *
 * Japanese  : その他
 * English   : Other
 * Chinese   : 其他
 * Korean    : 기타
 *
 * All four values mean the same thing to the API.
 */

const otherPurposeValues = new Set([
  "その他",
  "Other",
  "其他",
  "기타"
]);


/*
 * --------------------
 * POST
 * --------------------
 */

export const POST: APIRoute = async ({ request, redirect }) => {

  const locale = detectLocale(request);
  const config = localeConfig[locale];

  const errorPath = `${config.path}error/`;
  const thanksPath = `${config.path}thanks/`;


  try {

    const form = await request.formData();


    // --------------------
    // Honeypot
    // --------------------

    if (
      String(form.get("website") || "").trim() !== ""
    ) {

      return redirect(thanksPath);

    }


    // --------------------
    // Form Values
    // --------------------

    const category =
      String(form.get("category") || "").trim();

    const name =
      String(form.get("name") || "").trim();

    const sns =
      String(form.get("sns") || "").trim();

    const email =
      String(form.get("email") || "").trim();

    const organization =
      String(form.get("organization") || "").trim();

    const purpose =
      String(form.get("purpose") || "").trim();

    const otherPurpose =
      String(form.get("otherPurpose") || "").trim();

    const message =
      String(form.get("message") || "").trim();


    // --------------------
    // Required Validation
    // --------------------

    if (
      !category ||
      !name ||
      !email ||
      !purpose ||
      !message
    ) {

      return redirect(errorPath);

    }


    // --------------------
    // Length Validation
    // --------------------

    if (
      name.length > 50
    ) {

      return redirect(errorPath);

    }


    if (
      organization.length > 100
    ) {

      return redirect(errorPath);

    }


    if (
      otherPurpose.length > 200
    ) {

      return redirect(errorPath);

    }


    if (
      message.length > 2000
    ) {

      return redirect(errorPath);

    }


    // --------------------
    // Email Validation
    // --------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      !emailRegex.test(email)
    ) {

      return redirect(errorPath);

    }


    // --------------------
    // SNS / Website URL Validation
    // --------------------

    if (sns) {

      try {

        const snsUrl = new URL(sns);

        if (
          snsUrl.protocol !== "http:" &&
          snsUrl.protocol !== "https:"
        ) {

          return redirect(errorPath);

        }

      } catch {

        return redirect(errorPath);

      }

    }


    // --------------------
    // Other / Free Text
    // --------------------

    const isOtherPurpose =
      otherPurposeValues.has(purpose);


    if (
      isOtherPurpose &&
      !otherPurpose
    ) {

      return redirect(errorPath);

    }


    /*
     * If "Other" is selected, use the free-text value.
     * Otherwise use the selected purpose itself.
     */
    const finalPurpose =
      isOtherPurpose
        ? otherPurpose
        : purpose;


    // --------------------
    // Admin Notification
    // --------------------

    const adminResult =
      await resend.emails.send({

        from:
          "錦乃 お問い合わせ <contact@nishikinolab.net>",

        to:
          "contact@nishikinolab.net",

        replyTo:
          email,

        subject:
          `${config.subjectPrefix}${name}様より`,

        text:

`【ご相談者様について】

${category}


【お名前】

${name}


【メールアドレス】

${email}


【SNS・Webサイト】

${sns || config.noValue}


【法人・団体名】

${organization || config.noValue}


【ご相談内容】

${finalPurpose}


【お問い合わせ内容】

${message}


--------------------

送信日時:
${new Date().toLocaleString(
  locale === "ja"
    ? "ja-JP"
    : locale === "en"
      ? "en-US"
      : locale === "zh-cn"
        ? "zh-CN"
        : "ko-KR"
)}
`

      });


    // --------------------
    // Resend Admin Error
    // --------------------

    if (adminResult.error) {

      console.error(
        "Resend admin notification error:",
        adminResult.error
      );

      return redirect(errorPath);

    }


    // --------------------
    // Automatic Reply
    // --------------------

    const autoReplyResult =
      await resend.emails.send({

        from:
          locale === "ko"
            ? "錦乃니시키노 <contact@nishikinolab.net>"
            : locale === "zh-cn"
              ? "锦乃 <contact@nishikinolab.net>"
              : locale === "en"
                ? "Nishikino <contact@nishikinolab.net>"
                : "錦乃 <contact@nishikinolab.net>",

        to:
          email,

        subject:
          config.autoReplySubject,

        text:
          config.autoReplyBody({
            name,
            email,
            sns,
            organization,
            purpose: finalPurpose,
            message
          })

      });


    // --------------------
    // Resend Auto Reply Error
    // --------------------

    if (autoReplyResult.error) {

      console.error(
        "Resend automatic reply error:",
        autoReplyResult.error
      );

      /*
       * The administrator notification has already been sent.
       * Do not treat this as a completely failed inquiry.
       *
       * The user should still reach the thanks page because
       * the inquiry itself was successfully delivered.
       */

      return redirect(thanksPath);

    }


    // --------------------
    // Success
    // --------------------

    return redirect(thanksPath);


  } catch (error) {

    console.error(
      "Contact API error:",
      error
    );

    return redirect(errorPath);

  }

};