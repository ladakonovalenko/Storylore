import os
from . import models, schemas
from .database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
from .auth import hash_password, verify_password, create_access_token, create_refresh_token, get_current_user
from fastapi.responses import Response  # ДОДАТИ цей імпорт у верх routers.py, якщо його там нема
from urllib.parse import quote

router = APIRouter()


# ==========================================
# 🔐 АВТОРИЗАЦІЯ (Auth)
# ==========================================

@router.post("/auth/register", response_model=schemas.TokenResponse, tags=["Auth"])
def register(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    # Перевіряємо чи email вже існує
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Цей email вже зареєстрований")

    db_user = models.User(
        email         = user_in.email.lower().strip(),
        username      = user_in.username.strip(),
        password_hash = hash_password(user_in.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return schemas.TokenResponse(
        access_token  = create_access_token(db_user.id),
        refresh_token = create_refresh_token(db_user.id),
        user          = db_user,
    )


@router.post("/auth/login", response_model=schemas.TokenResponse, tags=["Auth"])
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Невірний email або пароль")

    return schemas.TokenResponse(
        access_token  = create_access_token(user.id),
        refresh_token = create_refresh_token(user.id),
        user          = user,
    )


@router.get("/auth/me", response_model=schemas.UserResponse, tags=["Auth"])
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/auth/me", response_model=schemas.UserResponse, tags=["Auth"])
def update_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.email and payload.email.lower().strip() != current_user.email:
        new_email = payload.email.lower().strip()
        if db.query(models.User).filter(models.User.email == new_email).first():
            raise HTTPException(status_code=400, detail="Цей email вже використовується")
        current_user.email = new_email

    if payload.username:
        current_user.username = payload.username.strip()

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/auth/me/password", tags=["Auth"])
def change_password(
    payload: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Поточний пароль неправильний")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Пароль оновлено"}

# ==========================================
# 📑 ШАБЛОНИ
# ==========================================

CHARACTER_TEMPLATES = {
    "protagonist": {
        "template_name": "Головний герой (Протагоніст)",
        "template_key": "protagonist",
        "description": "Для головного героя з чіткою метою та внутрішнім конфліктом.",
        "role": "Протагоніст",
        "rank": "Головний",
        "fields": [
            {
                "key": "description",
                "label": "Опис",
                "type": "textarea",
                "required": True,
                "placeholder": "Хто цей персонаж у двох реченнях?",
                "hint": "Коротко: хто він, яка його головна риса.",
                "example": "Молодий маг із провінції, якому судилося врятувати королівство, але він ще не знає про це.",
            },
            {
                "key": "biography",
                "label": "Передісторія",
                "type": "textarea",
                "required": False,
                "placeholder": "Звідки він/вона з'явились?",
                "hint": "Ключові події минулого, що сформували характер.",
                "example": "Виріс у маленькому селі, втратив батьків у дитинстві. Навчався в академії магії, але відрахований за порушення правил.",
            },
            {
                "key": "motivation_goals",
                "label": "Мотивація та цілі",
                "type": "textarea",
                "required": True,
                "placeholder": "Чого прагне персонаж найбільше?",
                "hint": "Зовнішня мета (що він робить) і внутрішня потреба (чого насправді шукає).",
                "example": "Зовнішня: знайти артефакт, що закриє портал темряви. Внутрішня: довести собі, що він гідний довіри людей.",
            },
            {
                "key": "character_traits",
                "label": "Риси характеру",
                "type": "textarea",
                "required": False,
                "placeholder": "Як поводиться у різних ситуаціях?",
                "hint": "2-3 позитивні та 1-2 негативні риси для реалістичності.",
                "example": "Сміливий, але імпульсивний. Щирий до болю. Не вміє просити про допомогу.",
            },
            {
                "key": "fears_vulnerabilities",
                "label": "Страхи та вразливості",
                "type": "textarea",
                "required": True,
                "placeholder": "Чого боїться? Де його слабке місце?",
                "hint": "Страх — це двигун конфлікту. Без нього герой не розвивається.",
                "example": "Боїться зрадити тих, кого любить. Не може діяти холоднокровно, коли під загрозою діти.",
            },
            {
                "key": "character_arc",
                "label": "Арка персонажа",
                "type": "textarea",
                "required": False,
                "placeholder": "Як він зміниться до кінця історії?",
                "hint": "Де він на початку → що трапляється → ким стає в кінці.",
                "example": "Починає як самотній вовк → вчиться довіряти союзникам → жертвує собою заради команди.",
            },
            {
                "key": "appearance",
                "label": "Зовнішність",
                "type": "textarea",
                "required": False,
                "placeholder": "Як він виглядає?",
                "hint": "Деталі, що запам'ятовуються: шрам, манера триматися, особлива риса.",
                "example": "Невисокий, темноволосий. Ліве око замінене кристалічним — наслідок невдалого заклинання.",
            },
            {
                "key": "skills",
                "label": "Навички",
                "type": "textarea",
                "required": False,
                "placeholder": "Що вміє робити краще за інших?",
                "hint": "Навички мають відображати передісторію і стати в пригоді в сюжеті.",
                "example": "Майстер ілюзій. Добре читає людей. Виживання в дикій природі.",
            },
            {
                "key": "secrets",
                "label": "Таємниці",
                "type": "textarea",
                "required": False,
                "placeholder": "Що він приховує від інших або від себе?",
                "hint": "Таємниця — це потенційний сюжетний поворот.",
                "example": "Знає, що портал відкрив його батько. Ніколи нікому не розповідав.",
            },
        ],
        "default_values": {
            "status": "Живий",
            "role": "Протагоніст",
            "rank": "Головний",
        },
    },

    "antagonist": {
        "template_name": "Лиходій (Антагоніст)",
        "template_key": "antagonist",
        "description": "Для переконливого антагоніста з логічною мотивацією.",
        "role": "Антагоніст",
        "rank": "Головний",
        "fields": [
            {
                "key": "description",
                "label": "Опис",
                "type": "textarea",
                "required": True,
                "placeholder": "Хто цей персонаж?",
                "hint": "Найкращі лиходії — це герої власних історій.",
                "example": "Колишній паладин, що зрікся богів після того, як вони не врятували його місто.",
            },
            {
                "key": "motivation_goals",
                "label": "Мотивація та цілі",
                "type": "textarea",
                "required": True,
                "placeholder": "Чого він насправді хоче?",
                "hint": "Лиходій повинен мати зрозумілу мотивацію — навіть якщо методи жахливі.",
                "example": "Хоче знищити систему, що дозволяє богам ігнорувати страждання смертних. Щиро вірить, що робить правильно.",
            },
            {
                "key": "biography",
                "label": "Передісторія",
                "type": "textarea",
                "required": False,
                "placeholder": "Що зробило його таким?",
                "hint": "Поворотна точка: момент, коли він обрав цей шлях.",
                "example": "Двадцять років тому чума знищила його місто. Він молився три дні — боги мовчали. Того дня він поклявся покінчити з ними.",
            },
            {
                "key": "character_traits",
                "label": "Риси характеру",
                "type": "textarea",
                "required": False,
                "placeholder": "Яка він людина?",
                "hint": "Дайте йому чесноти — це зробить його страшнішим.",
                "example": "Харизматичний, дисциплінований, по-своєму справедливий. Ніколи не ламає обіцянок. Жорстокий лише до тих, хто заважає меті.",
            },
            {
                "key": "fears_vulnerabilities",
                "label": "Слабкі місця",
                "type": "textarea",
                "required": False,
                "placeholder": "Де він вразливий?",
                "hint": "Навіть найсильніший антагоніст має ахіллесову п'яту.",
                "example": "Не може завдати шкоди дітям. Все ще зберігає медальйон загиблої доньки.",
            },
            {
                "key": "appearance",
                "label": "Зовнішність",
                "type": "textarea",
                "required": False,
                "placeholder": "Як він виглядає?",
                "hint": "Зовнішність має відображати характер, не кліше.",
                "example": "Висока, підтягнута постать. Сіре волосся, спокійні очі. Одягається просто — влада не потребує прикрас.",
            },
            {
                "key": "secrets",
                "label": "Таємниці",
                "type": "textarea",
                "required": False,
                "placeholder": "Що він приховує?",
                "hint": "Таємниця антагоніста може стати ключем до його поразки або порятунку.",
                "example": "Один із богів запропонував йому угоду — він відмовився. Ніхто не знає, що він міг зупинитись, але обрав продовжувати.",
            },
        ],
        "default_values": {
            "status": "Живий",
            "role": "Антагоніст",
            "rank": "Головний",
        },
    },

    "mentor": {
        "template_name": "Наставник",
        "template_key": "mentor",
        "description": "Для мудрого наставника з власною темною стороною минулого.",
        "role": "Наставник",
        "rank": "Другорядний",
        "fields": [
            {
                "key": "description",
                "label": "Опис",
                "type": "textarea",
                "required": True,
                "placeholder": "Хто цей наставник?",
                "hint": "Наставник — це те, ким міг стати герой, або чим він може стати.",
                "example": "Старий архімаг, що добровільно пішов у вигнання після того, як його учень перейшов на темний бік.",
            },
            {
                "key": "biography",
                "label": "Передісторія",
                "type": "textarea",
                "required": False,
                "placeholder": "Яким був його шлях?",
                "hint": "Що він пройшов, що зробило його мудрим? Яка його найбільша помилка?",
                "example": "Колись був найсильнішим магом епохи. Втратив свого учня через гордість. Відтоді навчає обережності.",
            },
            {
                "key": "motivation_goals",
                "label": "Мотивація",
                "type": "textarea",
                "required": False,
                "placeholder": "Чому він навчає?",
                "hint": "Справжня мотивація наставника часто прихована — спокута, надія, борг.",
                "example": "Хоче виховати когось, хто виправить його помилки. Шукає спокути.",
            },
            {
                "key": "character_traits",
                "label": "Риси характеру",
                "type": "textarea",
                "required": False,
                "placeholder": "Як він взаємодіє з учнями?",
                "hint": "Хороший наставник не ідеальний — у нього є свої бар'єри і сліпі зони.",
                "example": "Мудрий, але дистанційований. Дає підказки замість відповідей. Погано говорить про почуття.",
            },
            {
                "key": "fears_vulnerabilities",
                "label": "Страхи",
                "type": "textarea",
                "required": False,
                "placeholder": "Чого він боїться?",
                "hint": "Страх наставника часто пов'язаний з повторенням минулих помилок.",
                "example": "Боїться, що знову виховає того, хто обере зло. Боїться прив'язатись.",
            },
            {
                "key": "secrets",
                "label": "Таємниці",
                "type": "textarea",
                "required": False,
                "placeholder": "Що він не розповідає учням?",
                "hint": "Таємниця наставника — це часто ключ до розуміння всієї історії.",
                "example": "Знає справжнє ім'я антагоніста. Це його колишній учень.",
            },
            {
                "key": "skills",
                "label": "Навички та знання",
                "type": "textarea",
                "required": False,
                "placeholder": "Що він може передати учням?",
                "example": "Майстер бойової магії. Знає давні мови. Читав усі відомі пророцтва.",
            },
        ],
        "default_values": {
            "status": "Живий",
            "role": "Наставник",
            "rank": "Другорядний",
        },
    },

    "love_interest": {
        "template_name": "Любовний інтерес",
        "template_key": "love_interest",
        "description": "Для персонажа, який є романтичним інтересом протагоніста.",
        "role": "Любовний інтерес",
        "rank": "Другорядний",
        "fields": [
            {
                "key": "description",
                "label": "Опис",
                "type": "textarea",
                "required": True,
                "placeholder": "Хто цей персонаж?",
                "hint": "Любовний інтерес — повноцінна особистість, не лише об'єкт кохання.",
                "example": "Капітан варти з міста, що живе за власним кодексом честі та не підкорюється нічиїм наказам.",
            },
            {
                "key": "motivation_goals",
                "label": "Особиста мета",
                "type": "textarea",
                "required": True,
                "placeholder": "Чого прагне незалежно від протагоніста?",
                "hint": "Власна мета робить персонажа живим, а не допоміжним.",
                "example": "Хоче реформувати варту міста зсередини. Має власний план, що може суперечити планам протагоніста.",
            },
            {
                "key": "biography",
                "label": "Передісторія",
                "type": "textarea",
                "required": False,
                "placeholder": "Що сформувало цю людину?",
                "example": "Виросла в сім'ї стражника. Бачила корупцію зсередини. Вступила до варти, щоб змінити систему.",
            },
            {
                "key": "character_traits",
                "label": "Риси характеру",
                "type": "textarea",
                "required": False,
                "placeholder": "Яка вона/він у стосунках та поза ними?",
                "hint": "Покажіть, як риси характеру впливають на розвиток стосунків.",
                "example": "Незалежна, іронічна, надійна. Складно відкривається людям. Коли прив'язується — захищає до останнього.",
            },
            {
                "key": "fears_vulnerabilities",
                "label": "Вразливості",
                "type": "textarea",
                "required": False,
                "placeholder": "Що може зранити цю людину?",
                "hint": "Вразливість — це місце де починаються справжні стосунки.",
                "example": "Боїться стати залежною від когось. Попередні стосунки закінчились зрадою.",
            },
            {
                "key": "appearance",
                "label": "Зовнішність",
                "type": "textarea",
                "required": False,
                "placeholder": "Як виглядає?",
                "example": "Рuda, невисока, завжди в уніформі. Очі — єдине, що видає емоції.",
            },
            {
                "key": "values_beliefs",
                "label": "Цінності",
                "type": "textarea",
                "required": False,
                "placeholder": "У що вірить? Що для неї/нього важливо?",
                "hint": "Цінності визначають де виникнуть конфлікти у стосунках.",
                "example": "Справедливість понад усе. Ніколи не залишає своїх. Чесність навіть якщо боляче.",
            },
        ],
        "default_values": {
            "status": "Живий",
            "role": "Любовний інтерес",
            "rank": "Другорядний",
        },
    },

    "sidekick": {
        "template_name": "Вірний супутник",
        "template_key": "sidekick",
        "description": "Для другорядного персонажа, що супроводжує головного героя.",
        "role": "Союзник",
        "rank": "Другорядний",
        "fields": [
            {
                "key": "description", "label": "Опис", "type": "textarea", "required": True,
                "placeholder": "Хто цей персонаж?",
                "hint": "Супутник — дзеркало героя. Часто підкреслює його сильні або слабкі сторони.",
                "example": "Жартівливий злодій, що приєднався до героя заради грошей, але залишився заради дружби.",
            },
            {
                "key": "motivation_goals", "label": "Мотивація", "type": "textarea", "required": False,
                "placeholder": "Чому він поруч з героєм?",
                "hint": "Найцікавіше коли мотивація змінюється протягом історії.",
                "example": "Спочатку: гроші та пригоди. Потім: єдине місце де він відчуває себе потрібним.",
            },
            {
                "key": "character_traits", "label": "Риси характеру", "type": "textarea", "required": False,
                "placeholder": "Яка він людина?",
                "example": "Балакучий, оптимістичний, боягузливий на перший погляд але сміливий коли важливо.",
            },
            {
                "key": "skills", "label": "Навички", "type": "textarea", "required": False,
                "placeholder": "Що він вміє?",
                "hint": "Навички мають доповнювати героя, а не дублювати.",
                "example": "Злодійські трюки, знання вулиць, вміння розговорити будь-кого.",
            },
            {
                "key": "biography", "label": "Передісторія", "type": "textarea", "required": False,
                "placeholder": "Звідки він?",
                "example": "Вуличний злодій з портового міста. Батьків не знав. Виживав як міг.",
            },
            {
                "key": "secrets", "label": "Таємниці", "type": "textarea", "required": False,
                "placeholder": "Що він приховує?",
                "example": "Колись здав свого друга владі за помилування. Досі не пробачив собі.",
            },
        ],
        "default_values": {"status": "Живий", "role": "Союзник", "rank": "Другорядний"},
    },

    "villain_minion": {
        "template_name": "Прислужник лиходія",
        "template_key": "villain_minion",
        "description": "Для другорядного антагоніста або підручного головного лиходія.",
        "role": "Антагоніст",
        "rank": "Другорядний",
        "fields": [
            {
                "key": "description", "label": "Опис", "type": "textarea", "required": True,
                "placeholder": "Хто цей персонаж?",
                "hint": "Навіть прислужник заслуговує на особистість.",
                "example": "Командир елітного загону, фанатично відданий лідеру. Сам себе вважає захисником порядку.",
            },
            {
                "key": "motivation_goals", "label": "Мотивація", "type": "textarea", "required": True,
                "placeholder": "Чому він служить лиходію?",
                "hint": "Страх, переконання, борг, вигода — кожен варіант дає різного персонажа.",
                "example": "Щиро вірить у справу лідера. Вважає, що жорстокі методи виправдані великою метою.",
            },
            {
                "key": "character_traits", "label": "Риси характеру", "type": "textarea", "required": False,
                "placeholder": "Яка він людина поза службою?",
                "example": "Дисциплінований, справедливий до своїх. З ворогами — безжалісний.",
            },
            {
                "key": "fears_vulnerabilities", "label": "Слабкі місця", "type": "textarea", "required": False,
                "placeholder": "Де він вразливий?",
                "example": "Сліпо довіряє лідеру. Якщо той зрадить — втратить будь-який орієнтир.",
            },
            {
                "key": "biography", "label": "Передісторія", "type": "textarea", "required": False,
                "placeholder": "Як він потрапив на цей шлях?",
                "example": "Ветеран війни, якого система відкинула. Лиходій дав йому мету і братерство.",
            },
        ],
        "default_values": {"status": "Живий", "role": "Антагоніст", "rank": "Другорядний"},
    },

    "npc": {
        "template_name": "Другорядний NPC",
        "template_key": "npc",
        "description": "Швидкий шаблон для другорядних персонажів і статистів.",
        "role": "Другорядний персонаж",
        "rank": "Другорядний",
        "fields": [
            {
                "key": "description", "label": "Опис", "type": "textarea", "required": True,
                "placeholder": "Хто цей персонаж у одному реченні?",
                "example": "Власник таверни, що знає всі плітки міста.",
            },
            {
                "key": "motivation_goals", "label": "Мотивація", "type": "textarea", "required": False,
                "placeholder": "Чого він хоче?",
                "example": "Спокій і прибуток. Не хоче проблем.",
            },
            {
                "key": "character_traits", "label": "Риси", "type": "textarea", "required": False,
                "placeholder": "Одна-дві риси що його виділяють.",
                "example": "Балакучий, спостережливий, недовірливий до чужинців.",
            },
            {
                "key": "skills", "label": "Чим корисний для сюжету?", "type": "textarea", "required": False,
                "placeholder": "Яку роль відіграє в історії?",
                "example": "Може дати інформацію про підпільне казино. Знає таємний вхід до замку.",
            },
        ],
        "default_values": {"status": "Живий", "role": "Другорядний персонаж", "rank": "Другорядний"},
    },
}


@router.get("/characters/templates", response_model=List[schemas.CharacterTemplateResponse], tags=["Templates"])
def get_character_templates():
    return list(CHARACTER_TEMPLATES.values())


@router.get("/characters/templates/{template_key}", response_model=schemas.CharacterTemplateResponse,
            tags=["Templates"])
def get_single_template(template_key: str):
    if template_key not in CHARACTER_TEMPLATES:
        raise HTTPException(status_code=404, detail="Шаблон не знайдено")
    return CHARACTER_TEMPLATES[template_key]


# ==========================================
# 🧬 ВЛАСНІ ШАБЛОНИ ПЕРСОНАЖІВ
# ==========================================
@router.post("/custom-templates", response_model=schemas.CustomTemplateResponse, tags=["CustomTemplates"])
def create_custom_template(payload: schemas.CustomTemplateCreate, db: Session = Depends(get_db)):
    db_template = models.CustomTemplate(**payload.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.get("/projects/{project_id}/custom-templates", response_model=List[schemas.CustomTemplateResponse],
            tags=["CustomTemplates"])
def get_project_custom_templates(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.CustomTemplate).filter(models.CustomTemplate.project_id == project_id).all()


@router.get("/custom-templates/{template_id}", response_model=schemas.CustomTemplateResponse, tags=["CustomTemplates"])
def get_custom_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(models.CustomTemplate).filter(models.CustomTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не знайдено")
    return template


@router.put("/custom-templates/{template_id}", response_model=schemas.CustomTemplateResponse, tags=["CustomTemplates"])
def update_custom_template(template_id: int, payload: schemas.CustomTemplateUpdate, db: Session = Depends(get_db)):
    db_template = db.query(models.CustomTemplate).filter(models.CustomTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Шаблон не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_template, key, value)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.delete("/custom-templates/{template_id}", tags=["CustomTemplates"])
def delete_custom_template(template_id: int, db: Session = Depends(get_db)):
    db_template = db.query(models.CustomTemplate).filter(models.CustomTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Шаблон не знайдено")
    db.delete(db_template)  # cascade видалить пов'язані поля
    db.commit()
    return {"detail": "Шаблон видалено"}


@router.post("/custom-templates/{template_id}/fields", response_model=schemas.CustomTemplateFieldResponse,
             tags=["CustomTemplates"])
def add_custom_template_field(template_id: int, payload: schemas.CustomTemplateFieldCreate,
                              db: Session = Depends(get_db)):
    db_template = db.query(models.CustomTemplate).filter(models.CustomTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Шаблон не знайдено")
    max_order = db.query(models.CustomTemplateField).filter(
        models.CustomTemplateField.template_id == template_id).count()
    db_field = models.CustomTemplateField(template_id=template_id, **payload.model_dump(), order_index=max_order)
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    return db_field


@router.put("/custom-template-fields/{field_id}", response_model=schemas.CustomTemplateFieldResponse,
            tags=["CustomTemplates"])
def update_custom_template_field(field_id: int, payload: schemas.CustomTemplateFieldUpdate,
                                 db: Session = Depends(get_db)):
    db_field = db.query(models.CustomTemplateField).filter(models.CustomTemplateField.id == field_id).first()
    if not db_field:
        raise HTTPException(status_code=404, detail="Поле не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_field, key, value)
    db.commit()
    db.refresh(db_field)
    return db_field


@router.delete("/custom-template-fields/{field_id}", tags=["CustomTemplates"])
def delete_custom_template_field(field_id: int, db: Session = Depends(get_db)):
    db_field = db.query(models.CustomTemplateField).filter(models.CustomTemplateField.id == field_id).first()
    if not db_field:
        raise HTTPException(status_code=404, detail="Поле не знайдено")
    db.delete(db_field)
    db.commit()
    return {"detail": "Поле видалено"}


@router.put("/custom-templates/{template_id}/fields/reorder", response_model=List[schemas.CustomTemplateFieldResponse],
            tags=["CustomTemplates"])
def reorder_custom_template_fields(template_id: int, payload: schemas.CustomTemplateFieldReorder,
                                   db: Session = Depends(get_db)):
    for index, field_id in enumerate(payload.field_ids):
        db.query(models.CustomTemplateField).filter(
            models.CustomTemplateField.id == field_id,
            models.CustomTemplateField.template_id == template_id,
        ).update({"order_index": index}, synchronize_session=False)
    db.commit()
    return (
        db.query(models.CustomTemplateField)
        .filter(models.CustomTemplateField.template_id == template_id)
        .order_by(models.CustomTemplateField.order_index)
        .all()
    )


# ==========================================
# 🏰 ФРАКЦІЇ
# ==========================================
@router.post("/factions", response_model=schemas.FactionResponse, tags=["Factions"])
def create_faction(faction_in: schemas.FactionCreate, db: Session = Depends(get_db)):
    db_faction = models.Faction(**faction_in.model_dump())
    db.add(db_faction)
    db.commit()
    db.refresh(db_faction)
    return db_faction


@router.get("/factions/{faction_id}/characters", response_model=List[schemas.CharacterResponse], tags=["Factions"])
def get_faction_characters(faction_id: int, db: Session = Depends(get_db)):
    return db.query(models.Character).filter(models.Character.faction_id == faction_id).all()


@router.put("/factions/{faction_id}/characters", response_model=List[schemas.CharacterResponse], tags=["Factions"])
def set_faction_characters(faction_id: int, payload: schemas.FactionCharacterAssignment, db: Session = Depends(get_db)):
    db_faction = db.query(models.Faction).filter(models.Faction.id == faction_id).first()
    if not db_faction:
        raise HTTPException(status_code=404, detail="Фракцію не знайдено")

    # Прибираємо фракцію в усіх, хто був у ній, але не потрапив у новий список
    db.query(models.Character).filter(models.Character.faction_id == faction_id).update(
        {"faction_id": None}, synchronize_session=False
    )
    # Призначаємо фракцію новим вибраним персонажам
    if payload.character_ids:
        db.query(models.Character).filter(models.Character.id.in_(payload.character_ids)).update(
            {"faction_id": faction_id}, synchronize_session=False
        )

    db.commit()
    return db.query(models.Character).filter(models.Character.faction_id == faction_id).all()


@router.get("/projects/{project_id}/factions", response_model=List[schemas.FactionResponse], tags=["Factions"])
def get_project_factions(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Faction).filter(models.Faction.project_id == project_id).all()

@router.put("/factions/{faction_id}", response_model=schemas.FactionResponse, tags=["Factions"])
def update_faction(faction_id: int, faction_in: schemas.FactionUpdate, db: Session = Depends(get_db)):
    db_faction = db.query(models.Faction).filter(models.Faction.id == faction_id).first()
    if not db_faction:
        raise HTTPException(status_code=404, detail="Фракцію не знайдено")
    for key, value in faction_in.model_dump(exclude_unset=True).items():
        setattr(db_faction, key, value)
    db.commit()
    db.refresh(db_faction)
    return db_faction

@router.delete("/factions/{faction_id}", tags=["Factions"])
def delete_faction(faction_id: int, db: Session = Depends(get_db)):
    db_faction = db.query(models.Faction).filter(models.Faction.id == faction_id).first()
    if not db_faction:
        raise HTTPException(status_code=404, detail="Фракцію не знайдено")
    db.delete(db_faction)
    db.commit()
    return {"detail": "Фракцію видалено"}

# ==========================================
# 👤 ПЕРСОНАЖІ
# ==========================================
@router.post("/characters", response_model=schemas.CharacterResponse, tags=["Characters"])
def create_character(char_in: schemas.CharacterCreate, db: Session = Depends(get_db)):
    char_data = char_in.model_dump(exclude_unset=True)
    db_char   = models.Character()
    for key, value in char_data.items():
        if key == "tags":
            db_char.tags = ", ".join(value) if isinstance(value, list) else value
        elif hasattr(db_char, key):
            setattr(db_char, key, value)
    db.add(db_char)
    db.commit()
    db.refresh(db_char)
    return db_char

@router.put("/characters/{char_id}", response_model=schemas.CharacterResponse, tags=["Characters"])
def update_character(char_id: int, char_in: schemas.CharacterUpdate, db: Session = Depends(get_db)):
    db_char = db.query(models.Character).filter(models.Character.id == char_id).first()
    if not db_char:
        raise HTTPException(status_code=404, detail="Персонажа не знайдено")
    for key, value in char_in.model_dump(exclude_unset=True).items():
        if hasattr(db_char, key):
            setattr(db_char, key, value)
    db.commit()
    db.refresh(db_char)
    return db_char

@router.get("/characters", response_model=List[schemas.CharacterResponse], tags=["Characters"])
def get_all_characters(project_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Character)
    if project_id:
        query = query.filter(models.Character.project_id == project_id)
    return query.all()

@router.get("/characters/{character_id}", response_model=schemas.CharacterResponse, tags=["Characters"])
def get_character_by_id(character_id: int, db: Session = Depends(get_db)):
    char = db.query(models.Character).filter(models.Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Персонажа не знайдено")
    return char

@router.delete("/characters/{character_id}", tags=["Characters"])
def delete_character(character_id: int, db: Session = Depends(get_db)):
    db_char = db.query(models.Character).filter(models.Character.id == character_id).first()
    if not db_char:
        raise HTTPException(status_code=404, detail="Персонажа не знайдено")
    db.delete(db_char)
    db.commit()
    return {"detail": "Видалено"}

# ==========================================
# 🔗 ЗВ'ЯЗКИ (Relationships)
# ==========================================

# Допоміжна функція: завантажити зв'язок з вкладеними персонажами
def _get_rel_with_chars(db: Session, rel_id: int) -> models.CharacterRelationship:
    return (
        db.query(models.CharacterRelationship)
        .options(
            joinedload(models.CharacterRelationship.character),
            joinedload(models.CharacterRelationship.target),
        )
        .filter(models.CharacterRelationship.id == rel_id)
        .first()
    )

@router.post("/relationships", response_model=schemas.RelationshipResponse, tags=["Relationships"])
def create_relationship(rel_in: schemas.RelationshipCreate, db: Session = Depends(get_db)):
    # Перевіряємо що обидва персонажі існують
    for cid in [rel_in.character_id, rel_in.target_id]:
        if not db.query(models.Character).filter(models.Character.id == cid).first():
            raise HTTPException(status_code=404, detail=f"Персонажа з id={cid} не знайдено")

    db_rel = models.CharacterRelationship(**rel_in.model_dump())
    db.add(db_rel)
    db.commit()
    return _get_rel_with_chars(db, db_rel.id)

@router.get("/relationships", response_model=List[schemas.RelationshipResponse], tags=["Relationships"])
def get_all_relationships(
    project_id:   int = Query(None, description="Фільтр за проєктом"),
    character_id: int = Query(None, description="Фільтр за персонажем"),
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.CharacterRelationship)
        .options(
            joinedload(models.CharacterRelationship.character),
            joinedload(models.CharacterRelationship.target),
        )
    )
    if character_id:
        query = query.filter(
            (models.CharacterRelationship.character_id == character_id) |
            (models.CharacterRelationship.target_id   == character_id)
        )
    if project_id:
        # Фільтруємо через персонажів проєкту
        project_char_ids = (
            db.query(models.Character.id)
            .filter(models.Character.project_id == project_id)
            .subquery()
        )
        query = query.filter(
            models.CharacterRelationship.character_id.in_(project_char_ids)
        )
    return query.all()

@router.get("/relationships/{relationship_id}", response_model=schemas.RelationshipResponse, tags=["Relationships"])
def get_relationship(relationship_id: int, db: Session = Depends(get_db)):
    rel = _get_rel_with_chars(db, relationship_id)
    if not rel:
        raise HTTPException(status_code=404, detail="Зв'язок не знайдено")
    return rel

@router.put("/relationships/{relationship_id}", response_model=schemas.RelationshipResponse, tags=["Relationships"])
def update_relationship(relationship_id: int, rel_update: schemas.RelationshipUpdate, db: Session = Depends(get_db)):
    db_rel = db.query(models.CharacterRelationship).filter(models.CharacterRelationship.id == relationship_id).first()
    if not db_rel:
        raise HTTPException(status_code=404, detail="Зв'язок не знайдено")
    for key, value in rel_update.model_dump(exclude_unset=True).items():
        setattr(db_rel, key, value)
    db.commit()
    return _get_rel_with_chars(db, db_rel.id)

@router.delete("/relationships/{relationship_id}", tags=["Relationships"])
def delete_relationship(relationship_id: int, db: Session = Depends(get_db)):
    db_rel = db.query(models.CharacterRelationship).filter(models.CharacterRelationship.id == relationship_id).first()
    if not db_rel:
        raise HTTPException(status_code=404, detail="Зв'язок не знайдено")
    db.delete(db_rel)
    db.commit()
    return {"detail": "Зв'язок успішно видалено"}

# ── Зв'язки конкретного персонажа (зручний шорткат) ─────────────────────────
@router.get("/characters/{character_id}/relationships", response_model=List[schemas.RelationshipResponse], tags=["Relationships"])
def get_character_relationships(character_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.CharacterRelationship)
        .options(
            joinedload(models.CharacterRelationship.character),
            joinedload(models.CharacterRelationship.target),
        )
        .filter(
            (models.CharacterRelationship.character_id == character_id) |
            (models.CharacterRelationship.target_id   == character_id)
        )
        .all()
    )

# ==========================================
# 📜 ІСТОРІЯ ЗВ'ЯЗКІВ
# ==========================================
@router.post("/relationships/history", response_model=schemas.RelationshipHistoryResponse, tags=["Relationships"])
def add_history(hist_in: schemas.RelationshipHistoryCreate, db: Session = Depends(get_db)):
    db_hist = models.RelationshipHistory(**hist_in.model_dump())
    db.add(db_hist)
    db.commit()
    db.refresh(db_hist)
    return db_hist

# ==========================================
# ⏳ ХРОНОЛОГІЯ
# ==========================================
@router.post("/characters/events", response_model=schemas.CharacterEventResponse, tags=["Timeline"])
def create_event(event_in: schemas.CharacterEventCreate, db: Session = Depends(get_db)):
    db_event = models.CharacterEvent(**event_in.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


# ==========================================
# 📅 ПОДІЇ (Events / Timeline)
# ==========================================

def _ids_to_str(ids: list) -> str:
    return ",".join(str(i) for i in ids) if ids else ""


@router.post("/events", response_model=schemas.EventResponse, tags=["Events"])
def create_event(event_in: schemas.EventCreate, db: Session = Depends(get_db)):
    data = event_in.model_dump(exclude_unset=True)
    ids = data.pop("participant_ids", [])
    db_event = models.Event(**data, participant_ids=_ids_to_str(ids))
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@router.get("/events", response_model=List[schemas.EventResponse], tags=["Events"])
def get_events(
        project_id: int = Query(None),
        character_id: int = Query(None),
        event_type: str = Query(None),
        importance: str = Query(None),
        db: Session = Depends(get_db),
):
    query = db.query(models.Event)
    if project_id:
        query = query.filter(models.Event.project_id == project_id)
    if event_type:
        query = query.filter(models.Event.event_type == event_type)
    if importance:
        query = query.filter(models.Event.importance == importance)
    events = query.order_by(models.Event.year.nullslast(), models.Event.id).all()

    # Фільтр за учасником (після вибірки, бо учасники зберігаються як рядок)
    if character_id:
        events = [
            e for e in events
            if e.participant_ids and str(character_id) in e.participant_ids.split(",")
        ]
    return events


@router.get("/events/{event_id}", response_model=schemas.EventResponse, tags=["Events"])
def get_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Подію не знайдено")
    return ev


@router.put("/events/{event_id}", response_model=schemas.EventResponse, tags=["Events"])
def update_event(event_id: int, event_in: schemas.EventUpdate, db: Session = Depends(get_db)):
    ev = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Подію не знайдено")
    data = event_in.model_dump(exclude_unset=True)
    if "participant_ids" in data:
        data["participant_ids"] = _ids_to_str(data["participant_ids"])
    for key, value in data.items():
        setattr(ev, key, value)
    db.commit()
    db.refresh(ev)
    return ev


@router.delete("/events/{event_id}", tags=["Events"])
def delete_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Подію не знайдено")

    db.query(models.EventCausality).filter(
        (models.EventCausality.cause_event_id == event_id) |
        (models.EventCausality.effect_event_id == event_id)
    ).delete(synchronize_session=False)

    db.delete(ev)
    db.commit()
    return {"detail": "Подію видалено"}


# ==========================================
# 🏺 ЕРИ
# ==========================================
@router.post("/eras", response_model=schemas.EraResponse, tags=["Timeline"])
def create_era(era_in: schemas.EraCreate, db: Session = Depends(get_db)):
    db_era = models.Era(**era_in.model_dump())
    db.add(db_era)
    db.commit()
    db.refresh(db_era)
    return db_era


@router.get("/projects/{project_id}/eras", response_model=List[schemas.EraResponse], tags=["Timeline"])
def get_project_eras(project_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Era)
        .filter(models.Era.project_id == project_id)
        .order_by(models.Era.order_index)
        .all()
    )


@router.put("/eras/{era_id}", response_model=schemas.EraResponse, tags=["Timeline"])
def update_era(era_id: int, era_in: schemas.EraUpdate, db: Session = Depends(get_db)):
    db_era = db.query(models.Era).filter(models.Era.id == era_id).first()
    if not db_era:
        raise HTTPException(status_code=404, detail="Еру не знайдено")
    for key, value in era_in.model_dump(exclude_unset=True).items():
        setattr(db_era, key, value)
    db.commit()
    db.refresh(db_era)
    return db_era


@router.delete("/eras/{era_id}", tags=["Timeline"])
def delete_era(era_id: int, db: Session = Depends(get_db)):
    db_era = db.query(models.Era).filter(models.Era.id == era_id).first()
    if not db_era:
        raise HTTPException(status_code=404, detail="Еру не знайдено")
    db.query(models.Event).filter(models.Event.era_id == era_id).update(
        {"era_id": None}, synchronize_session=False
    )
    db.delete(db_era)
    db.commit()
    return {"detail": "Еру видалено"}


# ==========================================
# 📖 АРКИ
# ==========================================
@router.post("/arcs", response_model=schemas.ArcResponse, tags=["Timeline"])
def create_arc(arc_in: schemas.ArcCreate, db: Session = Depends(get_db)):
    db_arc = models.Arc(**arc_in.model_dump())
    db.add(db_arc)
    db.commit()
    db.refresh(db_arc)
    return db_arc


@router.get("/projects/{project_id}/arcs", response_model=List[schemas.ArcResponse], tags=["Timeline"])
def get_project_arcs(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Arc).filter(models.Arc.project_id == project_id).all()


@router.put("/arcs/{arc_id}", response_model=schemas.ArcResponse, tags=["Timeline"])
def update_arc(arc_id: int, arc_in: schemas.ArcUpdate, db: Session = Depends(get_db)):
    db_arc = db.query(models.Arc).filter(models.Arc.id == arc_id).first()
    if not db_arc:
        raise HTTPException(status_code=404, detail="Арку не знайдено")
    for key, value in arc_in.model_dump(exclude_unset=True).items():
        setattr(db_arc, key, value)
    db.commit()
    db.refresh(db_arc)
    return db_arc


@router.delete("/arcs/{arc_id}", tags=["Timeline"])
def delete_arc(arc_id: int, db: Session = Depends(get_db)):
    db_arc = db.query(models.Arc).filter(models.Arc.id == arc_id).first()
    if not db_arc:
        raise HTTPException(status_code=404, detail="Арку не знайдено")
    db.query(models.Event).filter(models.Event.arc_id == arc_id).update(
        {"arc_id": None}, synchronize_session=False
    )
    db.delete(db_arc)  # cascade видалить пов'язані ArcCharacterRole
    db.commit()
    return {"detail": "Арку видалено"}


@router.put("/arcs/{arc_id}/characters", response_model=schemas.ArcResponse, tags=["Timeline"])
def set_arc_characters(arc_id: int, payload: schemas.ArcCharacterAssignment, db: Session = Depends(get_db)):
    db_arc = db.query(models.Arc).filter(models.Arc.id == arc_id).first()
    if not db_arc:
        raise HTTPException(status_code=404, detail="Арку не знайдено")

    db.query(models.ArcCharacterRole).filter(models.ArcCharacterRole.arc_id == arc_id).delete(
        synchronize_session=False
    )
    for role_in in payload.roles:
        db.add(models.ArcCharacterRole(arc_id=arc_id, character_id=role_in.character_id, role=role_in.role))

    db.commit()
    db.refresh(db_arc)
    return db_arc


# ==========================================
# ⚡ ПРИЧИННО-НАСЛІДКОВІ ЗВ'ЯЗКИ ПОДІЙ
# ==========================================
@router.post("/event-causalities", response_model=schemas.EventCausalityResponse, tags=["Timeline"])
def create_event_causality(payload: schemas.EventCausalityCreate, db: Session = Depends(get_db)):
    for eid in [payload.cause_event_id, payload.effect_event_id]:
        if not db.query(models.Event).filter(models.Event.id == eid).first():
            raise HTTPException(status_code=404, detail=f"Подію з id={eid} не знайдено")
    db_link = models.EventCausality(**payload.model_dump())
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link


@router.get("/projects/{project_id}/event-causalities", response_model=List[schemas.EventCausalityResponse], tags=["Timeline"])
def get_project_event_causalities(project_id: int, db: Session = Depends(get_db)):
    event_ids = [e.id for e in db.query(models.Event).filter(models.Event.project_id == project_id).all()]
    if not event_ids:
        return []
    return db.query(models.EventCausality).filter(
        models.EventCausality.cause_event_id.in_(event_ids)
    ).all()


@router.delete("/event-causalities/{link_id}", tags=["Timeline"])
def delete_event_causality(link_id: int, db: Session = Depends(get_db)):
    link = db.query(models.EventCausality).filter(models.EventCausality.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Зв'язок не знайдено")
    db.delete(link)
    db.commit()
    return {"detail": "Зв'язок видалено"}


# ==========================================
# 🌐 ВИМІРИ (паралельні світи)
# ==========================================
@router.post("/dimensions", response_model=schemas.DimensionResponse, tags=["Locations"])
def create_dimension(payload: schemas.DimensionCreate, db: Session = Depends(get_db)):
    db_dim = models.Dimension(**payload.model_dump())
    db.add(db_dim)
    db.commit()
    db.refresh(db_dim)
    return db_dim


@router.get("/projects/{project_id}/dimensions", response_model=List[schemas.DimensionResponse], tags=["Locations"])
def get_project_dimensions(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Dimension).filter(models.Dimension.project_id == project_id).all()


@router.put("/dimensions/{dimension_id}", response_model=schemas.DimensionResponse, tags=["Locations"])
def update_dimension(dimension_id: int, payload: schemas.DimensionUpdate, db: Session = Depends(get_db)):
    db_dim = db.query(models.Dimension).filter(models.Dimension.id == dimension_id).first()
    if not db_dim:
        raise HTTPException(status_code=404, detail="Вимір не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_dim, key, value)
    db.commit()
    db.refresh(db_dim)
    return db_dim


@router.delete("/dimensions/{dimension_id}", tags=["Locations"])
def delete_dimension(dimension_id: int, db: Session = Depends(get_db)):
    db_dim = db.query(models.Dimension).filter(models.Dimension.id == dimension_id).first()
    if not db_dim:
        raise HTTPException(status_code=404, detail="Вимір не знайдено")
    # Локації цього виміру лишаються — просто "повертаються" в основний світ
    db.query(models.Location).filter(models.Location.dimension_id == dimension_id).update(
        {"dimension_id": None}, synchronize_session=False
    )
    db.delete(db_dim)
    db.commit()
    return {"detail": "Вимір видалено"}


# ==========================================
# 🗺️ ЛОКАЦІЇ (Мапа світу)
# ==========================================
@router.post("/locations", response_model=schemas.LocationResponse, tags=["Locations"])
def create_location(loc_in: schemas.LocationCreate, db: Session = Depends(get_db)):
    db_loc = models.Location(**loc_in.model_dump())
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc


@router.get("/projects/{project_id}/locations", response_model=List[schemas.LocationResponse], tags=["Locations"])
def get_project_locations(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Location).filter(models.Location.project_id == project_id).all()


@router.put("/locations/{location_id}", response_model=schemas.LocationResponse, tags=["Locations"])
def update_location(location_id: int, loc_in: schemas.LocationUpdate, db: Session = Depends(get_db)):
    db_loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not db_loc:
        raise HTTPException(status_code=404, detail="Локацію не знайдено")

    update_data = loc_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_loc, key, value)

    db.commit()
    db.refresh(db_loc)
    return db_loc


@router.delete("/locations/{location_id}", tags=["Locations"])
def delete_location(location_id: int, db: Session = Depends(get_db)):
    db_loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not db_loc:
        raise HTTPException(status_code=404, detail="Локацію не знайдено")

    # НОВЕ: видаляємо всі зв'язки, де ця локація задіяна (як джерело або як ціль)
    db.query(models.LocationRelationship).filter(
        (models.LocationRelationship.location_id == location_id) |
        (models.LocationRelationship.target_id == location_id)
    ).delete(synchronize_session=False)

    db.delete(db_loc)
    db.commit()
    return {"detail": "Локацію видалено"}


# ==========================================
# 🌿 ГІЛКИ (альтернативні таймлайни)
# ==========================================
@router.post("/branches", response_model=schemas.BranchResponse, tags=["Timeline"])
def create_branch(branch_in: schemas.BranchCreate, db: Session = Depends(get_db)):
    db_branch = models.Branch(**branch_in.model_dump())
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)
    return db_branch


@router.get("/projects/{project_id}/branches", response_model=List[schemas.BranchResponse], tags=["Timeline"])
def get_project_branches(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Branch).filter(models.Branch.project_id == project_id).all()


@router.put("/branches/{branch_id}", response_model=schemas.BranchResponse, tags=["Timeline"])
def update_branch(branch_id: int, branch_in: schemas.BranchUpdate, db: Session = Depends(get_db)):
    db_branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Гілку не знайдено")
    for key, value in branch_in.model_dump(exclude_unset=True).items():
        setattr(db_branch, key, value)
    db.commit()
    db.refresh(db_branch)
    return db_branch


@router.delete("/branches/{branch_id}", tags=["Timeline"])
def delete_branch(branch_id: int, db: Session = Depends(get_db)):
    db_branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Гілку не знайдено")
    # Події цієї гілки не видаляємо — лишаємо як "осиротілі" (branch_id = null),
    # так само як зроблено для ер і арок
    db.query(models.Event).filter(models.Event.branch_id == branch_id).update(
        {"branch_id": None}, synchronize_session=False
    )
    db.delete(db_branch)
    db.commit()
    return {"detail": "Гілку видалено"}


# ==========================================
# 🔗 ЗВ'ЯЗКИ МІЖ ЛОКАЦІЯМИ
# ==========================================
@router.post("/location-relationships", response_model=schemas.LocationRelationshipResponse, tags=["Locations"])
def create_location_relationship(rel_in: schemas.LocationRelationshipCreate, db: Session = Depends(get_db)):
    db_rel = models.LocationRelationship(**rel_in.model_dump())
    db.add(db_rel)
    db.commit()
    db.refresh(db_rel)
    return db_rel


@router.get("/projects/{project_id}/location-relationships", response_model=List[schemas.LocationRelationshipResponse], tags=["Locations"])
def get_project_location_relationships(project_id: int, db: Session = Depends(get_db)):
    location_ids = [
        loc.id for loc in db.query(models.Location).filter(models.Location.project_id == project_id).all()
    ]
    if not location_ids:
        return []
    return db.query(models.LocationRelationship).filter(
        models.LocationRelationship.location_id.in_(location_ids)
    ).all()


@router.put("/location-relationships/{relationship_id}", response_model=schemas.LocationRelationshipResponse, tags=["Locations"])
def update_location_relationship(relationship_id: int, rel_in: schemas.LocationRelationshipUpdate, db: Session = Depends(get_db)):
    db_rel = db.query(models.LocationRelationship).filter(models.LocationRelationship.id == relationship_id).first()
    if not db_rel:
        raise HTTPException(status_code=404, detail="Зв'язок не знайдено")

    for key, value in rel_in.model_dump(exclude_unset=True).items():
        setattr(db_rel, key, value)

    db.commit()
    db.refresh(db_rel)
    return db_rel


@router.delete("/location-relationships/{relationship_id}", tags=["Locations"])
def delete_location_relationship(relationship_id: int, db: Session = Depends(get_db)):
    db_rel = db.query(models.LocationRelationship).filter(models.LocationRelationship.id == relationship_id).first()
    if not db_rel:
        raise HTTPException(status_code=404, detail="Зв'язок не знайдено")

    db.delete(db_rel)
    db.commit()
    return {"detail": "Зв'язок видалено"}


# ==========================================
# 📚 БІБЛІОТЕКА (Wiki / Нотатки)
# ==========================================
@router.post("/wiki-articles", response_model=schemas.WikiArticleResponse, tags=["Wiki"])
def create_wiki_article(payload: schemas.WikiArticleCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"links"})
    db_article = models.WikiArticle(**data)
    db.add(db_article)
    db.commit()
    db.refresh(db_article)

    for link in payload.links:
        db.add(models.WikiArticleLink(article_id=db_article.id, **link.model_dump()))
    db.commit()
    db.refresh(db_article)
    return db_article


@router.get("/projects/{project_id}/wiki-articles", response_model=List[schemas.WikiArticleResponse], tags=["Wiki"])
def get_project_wiki_articles(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.WikiArticle).filter(models.WikiArticle.project_id == project_id).all()


@router.put("/wiki-articles/{article_id}", response_model=schemas.WikiArticleResponse, tags=["Wiki"])
def update_wiki_article(article_id: int, payload: schemas.WikiArticleUpdate, db: Session = Depends(get_db)):
    db_article = db.query(models.WikiArticle).filter(models.WikiArticle.id == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Статтю не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_article, key, value)
    db.commit()
    db.refresh(db_article)
    return db_article


@router.put("/wiki-articles/{article_id}/links", response_model=schemas.WikiArticleResponse, tags=["Wiki"])
def set_wiki_article_links(article_id: int, payload: schemas.WikiArticleLinksAssignment, db: Session = Depends(get_db)):
    db_article = db.query(models.WikiArticle).filter(models.WikiArticle.id == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Статтю не знайдено")

    db.query(models.WikiArticleLink).filter(models.WikiArticleLink.article_id == article_id).delete(
        synchronize_session=False
    )
    for link in payload.links:
        db.add(models.WikiArticleLink(article_id=article_id, **link.model_dump()))

    db.commit()
    db.refresh(db_article)
    return db_article


@router.delete("/wiki-articles/{article_id}", tags=["Wiki"])
def delete_wiki_article(article_id: int, db: Session = Depends(get_db)):
    db_article = db.query(models.WikiArticle).filter(models.WikiArticle.id == article_id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Статтю не знайдено")
    db.delete(db_article)  # cascade видалить пов'язані WikiArticleLink
    db.commit()
    return {"detail": "Статтю видалено"}


# ==========================================
# 🔔 НАГАДУВАННЯ ("Не забути")
# ==========================================
@router.post("/reminders", response_model=schemas.ReminderResponse, tags=["Reminders"])
def create_reminder(payload: schemas.ReminderCreate, db: Session = Depends(get_db)):
    db_reminder = models.Reminder(**payload.model_dump())
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder


@router.get("/projects/{project_id}/reminders", response_model=List[schemas.ReminderResponse], tags=["Reminders"])
def get_project_reminders(project_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Reminder)
        .filter(models.Reminder.project_id == project_id)
        .order_by(models.Reminder.is_done, models.Reminder.id.desc())
        .all()
    )


@router.put("/reminders/{reminder_id}", response_model=schemas.ReminderResponse, tags=["Reminders"])
def update_reminder(reminder_id: int, payload: schemas.ReminderUpdate, db: Session = Depends(get_db)):
    db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Нагадування не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_reminder, key, value)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder


@router.delete("/reminders/{reminder_id}", tags=["Reminders"])
def delete_reminder(reminder_id: int, db: Session = Depends(get_db)):
    db_reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Нагадування не знайдено")
    db.delete(db_reminder)
    db.commit()
    return {"detail": "Нагадування видалено"}


# ==========================================
# 🦴 КАРКАС СЮЖЕТУ
# ==========================================
@router.get("/projects/{project_id}/plot-outline", response_model=schemas.PlotOutlineResponse, tags=["PlotOutline"])
def get_plot_outline(project_id: int, db: Session = Depends(get_db)):
    outline = db.query(models.PlotOutline).filter(models.PlotOutline.project_id == project_id).first()
    if not outline:
        # Автоматично створюємо порожній каркас при першому зверненні
        outline = models.PlotOutline(project_id=project_id)
        db.add(outline)
        db.commit()
        db.refresh(outline)
    return outline


@router.put("/projects/{project_id}/plot-outline", response_model=schemas.PlotOutlineResponse, tags=["PlotOutline"])
def update_plot_outline(project_id: int, payload: schemas.PlotOutlineUpdate, db: Session = Depends(get_db)):
    outline = db.query(models.PlotOutline).filter(models.PlotOutline.project_id == project_id).first()
    if not outline:
        outline = models.PlotOutline(project_id=project_id)
        db.add(outline)

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(outline, key, value)

    db.commit()
    db.refresh(outline)
    return outline


# ==========================================
# 🎵 САУНДТРЕК
# ==========================================
@router.post("/soundtracks", response_model=schemas.SoundtrackResponse, tags=["Media"])
def create_soundtrack(payload: schemas.SoundtrackCreate, db: Session = Depends(get_db)):
    db_track = models.Soundtrack(**payload.model_dump())
    db.add(db_track)
    db.commit()
    db.refresh(db_track)
    return db_track


@router.get("/projects/{project_id}/soundtracks", response_model=List[schemas.SoundtrackResponse], tags=["Media"])
def get_project_soundtracks(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Soundtrack).filter(models.Soundtrack.project_id == project_id).all()


@router.put("/soundtracks/{track_id}", response_model=schemas.SoundtrackResponse, tags=["Media"])
def update_soundtrack(track_id: int, payload: schemas.SoundtrackUpdate, db: Session = Depends(get_db)):
    db_track = db.query(models.Soundtrack).filter(models.Soundtrack.id == track_id).first()
    if not db_track:
        raise HTTPException(status_code=404, detail="Трек не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_track, key, value)
    db.commit()
    db.refresh(db_track)
    return db_track


@router.delete("/soundtracks/{track_id}", tags=["Media"])
def delete_soundtrack(track_id: int, db: Session = Depends(get_db)):
    db_track = db.query(models.Soundtrack).filter(models.Soundtrack.id == track_id).first()
    if not db_track:
        raise HTTPException(status_code=404, detail="Трек не знайдено")
    db.delete(db_track)
    db.commit()
    return {"detail": "Трек видалено"}


# ==========================================
# 🖼️ МУДБОРД
# ==========================================
@router.post("/moodboard-images", response_model=schemas.MoodboardImageResponse, tags=["Media"])
def create_moodboard_image(payload: schemas.MoodboardImageCreate, db: Session = Depends(get_db)):
    db_img = models.MoodboardImage(**payload.model_dump())
    db.add(db_img)
    db.commit()
    db.refresh(db_img)
    return db_img


@router.get("/projects/{project_id}/moodboard-images", response_model=List[schemas.MoodboardImageResponse], tags=["Media"])
def get_project_moodboard_images(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.MoodboardImage).filter(models.MoodboardImage.project_id == project_id).all()


@router.put("/moodboard-images/{image_id}", response_model=schemas.MoodboardImageResponse, tags=["Media"])
def update_moodboard_image(image_id: int, payload: schemas.MoodboardImageUpdate, db: Session = Depends(get_db)):
    db_img = db.query(models.MoodboardImage).filter(models.MoodboardImage.id == image_id).first()
    if not db_img:
        raise HTTPException(status_code=404, detail="Зображення не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_img, key, value)
    db.commit()
    db.refresh(db_img)
    return db_img


@router.delete("/moodboard-images/{image_id}", tags=["Media"])
def delete_moodboard_image(image_id: int, db: Session = Depends(get_db)):
    db_img = db.query(models.MoodboardImage).filter(models.MoodboardImage.id == image_id).first()
    if not db_img:
        raise HTTPException(status_code=404, detail="Зображення не знайдено")
    db.delete(db_img)
    db.commit()
    return {"detail": "Зображення видалено"}

# ==========================================
# 🧩 СТРУКТУРА (довільні рухомі блоки)
# ==========================================
@router.post("/structure-blocks", response_model=schemas.StructureBlockResponse, tags=["Structure"])
def create_structure_block(payload: schemas.StructureBlockCreate, db: Session = Depends(get_db)):
    max_order = db.query(models.StructureBlock).filter(
        models.StructureBlock.project_id == payload.project_id
    ).count()
    db_block = models.StructureBlock(**payload.model_dump(), order_index=max_order)
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block


@router.get("/projects/{project_id}/structure-blocks", response_model=List[schemas.StructureBlockResponse], tags=["Structure"])
def get_project_structure_blocks(project_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.StructureBlock)
        .filter(models.StructureBlock.project_id == project_id)
        .order_by(models.StructureBlock.order_index)
        .all()
    )


@router.put("/structure-blocks/{block_id}", response_model=schemas.StructureBlockResponse, tags=["Structure"])
def update_structure_block(block_id: int, payload: schemas.StructureBlockUpdate, db: Session = Depends(get_db)):
    db_block = db.query(models.StructureBlock).filter(models.StructureBlock.id == block_id).first()
    if not db_block:
        raise HTTPException(status_code=404, detail="Блок не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_block, key, value)
    db.commit()
    db.refresh(db_block)
    return db_block


@router.delete("/structure-blocks/{block_id}", tags=["Structure"])
def delete_structure_block(block_id: int, db: Session = Depends(get_db)):
    db_block = db.query(models.StructureBlock).filter(models.StructureBlock.id == block_id).first()
    if not db_block:
        raise HTTPException(status_code=404, detail="Блок не знайдено")
    db.delete(db_block)
    db.commit()
    return {"detail": "Блок видалено"}


@router.put("/projects/{project_id}/structure-blocks/reorder", response_model=List[schemas.StructureBlockResponse], tags=["Structure"])
def reorder_structure_blocks(project_id: int, payload: schemas.StructureBlockReorder, db: Session = Depends(get_db)):
    for index, block_id in enumerate(payload.block_ids):
        db.query(models.StructureBlock).filter(
            models.StructureBlock.id == block_id,
            models.StructureBlock.project_id == project_id,
        ).update({"order_index": index}, synchronize_session=False)
    db.commit()
    return (
        db.query(models.StructureBlock)
        .filter(models.StructureBlock.project_id == project_id)
        .order_by(models.StructureBlock.order_index)
        .all()
    )


# ==========================================
# 📄 ВЛАСНІ СТОРІНКИ (Custom Pages)
# ==========================================
@router.post("/custom-pages", response_model=schemas.CustomPageResponse, tags=["CustomPages"])
def create_custom_page(payload: schemas.CustomPageCreate, db: Session = Depends(get_db)):
    max_order = db.query(models.CustomPage).filter(models.CustomPage.project_id == payload.project_id).count()
    db_page = models.CustomPage(**payload.model_dump(), order_index=max_order)
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page


@router.get("/projects/{project_id}/custom-pages", response_model=List[schemas.CustomPageResponse], tags=["CustomPages"])
def get_project_custom_pages(project_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.CustomPage)
        .filter(models.CustomPage.project_id == project_id)
        .order_by(models.CustomPage.order_index)
        .all()
    )


@router.put("/custom-pages/{page_id}", response_model=schemas.CustomPageResponse, tags=["CustomPages"])
def update_custom_page(page_id: int, payload: schemas.CustomPageUpdate, db: Session = Depends(get_db)):
    db_page = db.query(models.CustomPage).filter(models.CustomPage.id == page_id).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Сторінку не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_page, key, value)
    db.commit()
    db.refresh(db_page)
    return db_page


@router.delete("/custom-pages/{page_id}", tags=["CustomPages"])
def delete_custom_page(page_id: int, db: Session = Depends(get_db)):
    db_page = db.query(models.CustomPage).filter(models.CustomPage.id == page_id).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Сторінку не знайдено")
    db.delete(db_page)
    db.commit()
    return {"detail": "Сторінку видалено"}


@router.post("/custom-page-blocks", response_model=schemas.CustomPageBlockResponse, tags=["CustomPages"])
def create_custom_page_block(payload: schemas.CustomPageBlockCreate, db: Session = Depends(get_db)):
    max_order = db.query(models.CustomPageBlock).filter(models.CustomPageBlock.page_id == payload.page_id).count()
    db_block = models.CustomPageBlock(**payload.model_dump(), order_index=max_order)
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block


@router.get("/custom-pages/{page_id}/blocks", response_model=List[schemas.CustomPageBlockResponse], tags=["CustomPages"])
def get_custom_page_blocks(page_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.CustomPageBlock)
        .filter(models.CustomPageBlock.page_id == page_id)
        .order_by(models.CustomPageBlock.order_index)
        .all()
    )


@router.get("/projects/{project_id}/custom-pages/blocks", response_model=List[schemas.CustomPageBlockResponse],
            tags=["CustomPages"])
def get_project_custom_page_blocks(project_id: int, db: Session = Depends(get_db)):
    """Усі блоки всіх власних сторінок проєкту одним запитом —
    використовується для пошуку по вмісту (SearchModal), щоб не робити
    окремий запит на кожну сторінку (N+1)."""
    page_ids = [
        p.id for p in db.query(models.CustomPage).filter(models.CustomPage.project_id == project_id).all()
    ]
    if not page_ids:
        return []
    return (
        db.query(models.CustomPageBlock)
        .filter(models.CustomPageBlock.page_id.in_(page_ids))
        .all()
    )


@router.put("/custom-page-blocks/{block_id}", response_model=schemas.CustomPageBlockResponse, tags=["CustomPages"])
def update_custom_page_block(block_id: int, payload: schemas.CustomPageBlockUpdate, db: Session = Depends(get_db)):
    db_block = db.query(models.CustomPageBlock).filter(models.CustomPageBlock.id == block_id).first()
    if not db_block:
        raise HTTPException(status_code=404, detail="Блок не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_block, key, value)
    db.commit()
    db.refresh(db_block)
    return db_block


@router.delete("/custom-page-blocks/{block_id}", tags=["CustomPages"])
def delete_custom_page_block(block_id: int, db: Session = Depends(get_db)):
    db_block = db.query(models.CustomPageBlock).filter(models.CustomPageBlock.id == block_id).first()
    if not db_block:
        raise HTTPException(status_code=404, detail="Блок не знайдено")
    db.delete(db_block)
    db.commit()
    return {"detail": "Блок видалено"}


@router.put("/custom-pages/{page_id}/blocks/reorder", response_model=List[schemas.CustomPageBlockResponse], tags=["CustomPages"])
def reorder_custom_page_blocks(page_id: int, payload: schemas.CustomPageBlockReorder, db: Session = Depends(get_db)):
    for index, block_id in enumerate(payload.block_ids):
        db.query(models.CustomPageBlock).filter(
            models.CustomPageBlock.id == block_id,
            models.CustomPageBlock.page_id == page_id,
        ).update({"order_index": index}, synchronize_session=False)
    db.commit()
    return (
        db.query(models.CustomPageBlock)
        .filter(models.CustomPageBlock.page_id == page_id)
        .order_by(models.CustomPageBlock.order_index)
        .all()
    )


# ==========================================
# 🗂️ ПАПКИ НАВІГАЦІЇ (особисті, прив'язані до користувача)
# ==========================================
@router.post("/nav-folders", response_model=schemas.NavFolderResponse, tags=["Navigation"])
def create_nav_folder(
    payload: schemas.NavFolderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    max_order = db.query(models.NavFolder).filter(models.NavFolder.user_id == current_user.id).count()
    db_folder = models.NavFolder(name=payload.name, user_id=current_user.id, order_index=max_order)
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder


@router.get("/nav-folders", response_model=List[schemas.NavFolderResponse], tags=["Navigation"])
def get_nav_folders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.NavFolder)
        .filter(models.NavFolder.user_id == current_user.id)
        .order_by(models.NavFolder.order_index)
        .all()
    )


@router.put("/nav-folders/{folder_id}", response_model=schemas.NavFolderResponse, tags=["Navigation"])
def update_nav_folder(
    folder_id: int,
    payload: schemas.NavFolderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_folder = db.query(models.NavFolder).filter(
        models.NavFolder.id == folder_id, models.NavFolder.user_id == current_user.id
    ).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Папку не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_folder, key, value)
    db.commit()
    db.refresh(db_folder)
    return db_folder


@router.delete("/nav-folders/{folder_id}", tags=["Navigation"])
def delete_nav_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_folder = db.query(models.NavFolder).filter(
        models.NavFolder.id == folder_id, models.NavFolder.user_id == current_user.id
    ).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Папку не знайдено")
    db.delete(db_folder)
    db.commit()
    return {"detail": "Папку видалено"}


@router.post("/nav-folders/{folder_id}/items", response_model=schemas.NavItemResponse, tags=["Navigation"])
def add_nav_item(
    folder_id: int,
    payload: schemas.NavItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_folder = db.query(models.NavFolder).filter(
        models.NavFolder.id == folder_id, models.NavFolder.user_id == current_user.id
    ).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Папку не знайдено")
    max_order = db.query(models.NavItem).filter(models.NavItem.folder_id == folder_id).count()
    db_item = models.NavItem(folder_id=folder_id, item_type=payload.item_type, item_key=payload.item_key, order_index=max_order)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/nav-items/{item_id}", response_model=schemas.NavItemResponse, tags=["Navigation"])
def update_nav_item(
    item_id: int,
    payload: schemas.NavItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_item = db.query(models.NavItem).join(models.NavFolder).filter(
        models.NavItem.id == item_id, models.NavFolder.user_id == current_user.id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Елемент не знайдено")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/nav-items/{item_id}", tags=["Navigation"])
def delete_nav_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_item = db.query(models.NavItem).join(models.NavFolder).filter(
        models.NavItem.id == item_id, models.NavFolder.user_id == current_user.id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Елемент не знайдено")
    db.delete(db_item)
    db.commit()
    return {"detail": "Видалено з папки"}


# ==========================================
# 📂 ПРОЄКТИ
# ==========================================
@router.post("/projects", response_model=schemas.ProjectResponse, tags=["Projects"])
def create_project(
    project_in: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),  # ✅
):
    db_project = models.Project(**project_in.model_dump(), owner_id=current_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/projects", response_model=List[schemas.ProjectResponse], tags=["Projects"])
def get_all_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),  # ✅
):
    # Кожен бачить тільки свої проєкти
    return db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()


@router.put("/projects/{project_id}", response_model=schemas.ProjectResponse, tags=["Projects"])
def update_project(
    project_id: int,
    project_in: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),  # ✅
):
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.owner_id == current_user.id,  # ✅ тільки свій
    ).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Проєкт не знайдено")
    for key, value in project_in.model_dump(exclude_unset=True).items():
        setattr(db_project, key, value)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.delete("/projects/{project_id}", tags=["Projects"])
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),  # ✅
):
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.owner_id == current_user.id,  # ✅ тільки свій
    ).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Проєкт не знайдено")
    db.delete(db_project)
    db.commit()
    return {"detail": "Проєкт видалено"}


def _md_escape(text: str) -> str:
    """Прибирає зайві проблемні символи з тексту перед вставкою в Markdown."""
    return (text or "").replace("\r\n", "\n").strip()


def _md_section(title: str, level: int = 2) -> str:
    return f"\n{'#' * level} {title}\n"


@router.get("/projects/{project_id}/export-markdown", tags=["Export"])
def export_project_markdown(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проєкт не знайдено")

    lines = [f"# {project.title}\n"]
    if project.description:
        lines.append(_md_escape(project.description) + "\n")

    # ── Персонажі ────────────────────────────────────────────────
    characters = db.query(models.Character).filter(models.Character.project_id == project_id).all()
    if characters:
        lines.append(_md_section("Персонажі"))
        for c in characters:
            lines.append(f"\n### {c.name}")
            lines.append(f"_{c.role or ''} · {c.status or ''}_\n")
            for field_label, value in [
                ("Опис", c.description), ("Передісторія", c.biography),
                ("Зовнішність", c.appearance), ("Мотивація та цілі", c.motivation_goals),
                ("Риси характеру", c.character_traits), ("Страхи та вразливості", c.fears_vulnerabilities),
                ("Таємниці", c.secrets), ("Арка персонажа", c.character_arc),
            ]:
                if value:
                    lines.append(f"**{field_label}:** {_md_escape(value)}\n")

    # ── Фракції ──────────────────────────────────────────────────
    factions = db.query(models.Faction).filter(models.Faction.project_id == project_id).all()
    if factions:
        lines.append(_md_section("Фракції"))
        for f in factions:
            lines.append(f"\n### {f.name}")
            if f.type or f.alignment:
                lines.append(f"_{f.type or ''} · {f.alignment or ''}_\n")
            if f.description:
                lines.append(_md_escape(f.description) + "\n")

    # ── Локації ──────────────────────────────────────────────────
    locations = db.query(models.Location).filter(models.Location.project_id == project_id).all()
    if locations:
        lines.append(_md_section("Локації"))
        for loc in locations:
            lines.append(f"\n### {loc.name} _{loc.type or ''}_")
            if loc.description:
                lines.append(_md_escape(loc.description) + "\n")

    # ── Ери, арки, гілки, події ──────────────────────────────────
    eras = db.query(models.Era).filter(models.Era.project_id == project_id).order_by(models.Era.order_index).all()
    arcs = db.query(models.Arc).filter(models.Arc.project_id == project_id).all()
    branches = db.query(models.Branch).filter(models.Branch.project_id == project_id).all()
    events = db.query(models.Event).filter(models.Event.project_id == project_id).order_by(
        models.Event.year.nullslast()
    ).all()

    if eras:
        lines.append(_md_section("Ери"))
        for era in eras:
            year_range = ""
            if era.start_year is not None or era.end_year is not None:
                year_range = f" ({era.start_year or '…'} — {era.end_year or '…'})"
            lines.append(f"\n### {era.name}{year_range}")
            if era.description:
                lines.append(_md_escape(era.description) + "\n")

    if arcs:
        lines.append(_md_section("Арки сюжету"))
        for arc in arcs:
            lines.append(f"\n### {arc.title} _{arc.status}_")
            if arc.goal:
                lines.append(f"**Мета:** {_md_escape(arc.goal)}\n")
            if arc.description:
                lines.append(_md_escape(arc.description) + "\n")

    if branches:
        lines.append(_md_section("Альтернативні гілки"))
        for branch in branches:
            lines.append(f"\n### {branch.name}")
            if branch.description:
                lines.append(_md_escape(branch.description) + "\n")

    if events:
        lines.append(_md_section("Таймлайн подій"))
        for ev in events:
            year_label = ""
            if ev.year is not None:
                year_label = f"{abs(ev.year)} до н.е." if ev.year < 0 else f"{ev.year} н.е."
            elif ev.date_label:
                year_label = ev.date_label
            lines.append(f"\n### {ev.title}" + (f" — {year_label}" if year_label else ""))
            lines.append(f"_{ev.event_type or ''} · {ev.importance or ''}_\n")
            if ev.description:
                lines.append(_md_escape(ev.description) + "\n")

    # ── Бібліотека (вікі) ────────────────────────────────────────
    wiki_articles = db.query(models.WikiArticle).filter(models.WikiArticle.project_id == project_id).all()
    if wiki_articles:
        lines.append(_md_section("Бібліотека"))
        for article in wiki_articles:
            lines.append(f"\n### {article.title} _{article.category or ''}_")
            if article.content:
                lines.append(_md_escape(article.content) + "\n")

    # ── Каркас сюжету ────────────────────────────────────────────
    outline = db.query(models.PlotOutline).filter(models.PlotOutline.project_id == project_id).first()
    if outline and any([outline.logline, outline.setup, outline.rising_action,
                        outline.main_conflict, outline.key_turns,
                        outline.resolution_options, outline.ending]):
        lines.append(_md_section("Каркас сюжету"))
        for field_label, value in [
            ("Логлайн", outline.logline), ("Зав'язка", outline.setup),
            ("Розкачка", outline.rising_action), ("Основний конфлікт", outline.main_conflict),
            ("Ключові повороти", outline.key_turns), ("Варіанти вирішення", outline.resolution_options),
            ("Фінал", outline.ending),
        ]:
            if value:
                lines.append(f"**{field_label}:** {_md_escape(value)}\n")

    # ── Власні сторінки ──────────────────────────────────────────
    custom_pages = db.query(models.CustomPage).filter(models.CustomPage.project_id == project_id).order_by(
        models.CustomPage.order_index
    ).all()
    if custom_pages:
        lines.append(_md_section("Власні сторінки"))
        for page in custom_pages:
            lines.append(f"\n### {page.title}")
            blocks = db.query(models.CustomPageBlock).filter(
                models.CustomPageBlock.page_id == page.id
            ).order_by(models.CustomPageBlock.order_index).all()
            for block in blocks:
                lines.append(f"\n**{block.title}**\n")
                if block.content:
                    lines.append(_md_escape(block.content) + "\n")

    # ── Структура ────────────────────────────────────────────────
    structure_blocks = db.query(models.StructureBlock).filter(
        models.StructureBlock.project_id == project_id
    ).order_by(models.StructureBlock.order_index).all()
    if structure_blocks:
        lines.append(_md_section("Структура"))
        for block in structure_blocks:
            lines.append(f"\n### {block.title}\n")
            if block.content:
                lines.append(_md_escape(block.content) + "\n")

    # ── Не забути ────────────────────────────────────────────────
    reminders = db.query(models.Reminder).filter(models.Reminder.project_id == project_id).all()
    if reminders:
        lines.append(_md_section("Не забути"))
        for r in reminders:
            checkbox = "[x]" if r.is_done else "[ ]"
            lines.append(f"- {checkbox} {_md_escape(r.text)}")

    markdown_text = "\n".join(lines)

    # ВИПРАВЛЕНО: HTTP-заголовки можуть містити лише ASCII/latin-1 символи,
    # а назва проєкту зазвичай кирилична ("Спадок Імли") — пряме вставлення
    # ламало кодування (UnicodeEncodeError: 'latin-1' codec can't encode).
    # Тепер даємо два варіанти імені файлу: ASCII fallback (для старих
    # клієнтів) + правильно закодований UTF-8 варіант через filename*
    # (RFC 5987) — саме його розпізнає сучасний браузер і збереже файл
    # з людяною кириличною назвою.
    ascii_fallback = "".join(
        c for c in project.title if c.isascii() and (c.isalnum() or c in " _-")
    ).strip() or "project"
    encoded_filename = quote(f"{project.title}.md")

    return Response(
        content=markdown_text,
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{ascii_fallback}.md"; '
                f"filename*=UTF-8''{encoded_filename}"
            )
        },
    )