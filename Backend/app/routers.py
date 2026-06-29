import os
from . import models, schemas
from .database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
from .auth import hash_password, verify_password, create_access_token, create_refresh_token, get_current_user

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