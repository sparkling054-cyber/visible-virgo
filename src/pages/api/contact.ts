import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

const resend = new Resend(process.env.RESEND_API_KEY);


export const POST: APIRoute = async ({ request, redirect }) => {

  try {

    const form = await request.formData();


    // --------------------
    // Honeypot
    // --------------------

    if (
      String(form.get("website") || "").trim() !== ""
    ) {

      return redirect("/contact/thanks/");

    }



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
    // Validation
    // --------------------

    if (
      !category ||
      !name ||
      !email ||
      !purpose ||
      !message
    ) {

      return redirect("/contact/error/");

    }


    if(name.length > 50){

      return redirect("/contact/error/");

    }


    if(organization.length > 100){

      return redirect("/contact/error/");

    }


    if(message.length > 2000){

      return redirect("/contact/error/");

    }



    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if(!emailRegex.test(email)){

      return redirect("/contact/error/");

    }



    if(sns){

      try{

        new URL(sns);

      }catch{

        return redirect("/contact/error/");

      }

    }



    const finalPurpose =
      purpose === "その他"
        ? otherPurpose
        : purpose;



    if(
      purpose === "その他" &&
      !otherPurpose
    ){

      return redirect("/contact/error/");

    }



    // --------------------
    // 管理者通知
    // --------------------

    await resend.emails.send({

      from:
        "錦乃 お問い合わせ <contact@nishikinolab.net>",

      to:
        "contact@nishikinolab.net",

      replyTo:
        email,


      subject:
        `【お問い合わせ】${name}様より`,


      text:

`【ご相談者様について】

${category}


【お名前】

${name}


【メールアドレス】

${email}


【SNS・Webサイト】

${sns || "なし"}


【法人・団体名】

${organization || "なし"}


【ご相談内容】

${finalPurpose}


【お問い合わせ内容】

${message}


--------------------

送信日時:
${new Date().toLocaleString("ja-JP")}
`

    });



    // --------------------
    // 自動返信
    // --------------------

    await resend.emails.send({

      from:
        "錦乃 <contact@nishikinolab.net>",


      to:
        email,


      subject:
        "お問い合わせありがとうございます｜錦乃",


      text:

`${name} 様


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

${finalPurpose}


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

    });



    return redirect("/contact/thanks/");



  } catch(error){


    console.error(error);


    return redirect("/contact/error/");


  }


};