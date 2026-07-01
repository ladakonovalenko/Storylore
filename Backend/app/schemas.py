from pydantic import BaseModel, ConfigDict, field_validator, EmailStr
from typing import List, Optional, Union



# --- КОРИСТУВАЧІ ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email:    str
    username: str
    password: str

class UserLogin(BaseModel):
    email:    str
    password: str

class UserResponse(BaseModel):
    id:       int
    email:    str
    username: str
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    user:          UserResponse


# --- РЕДАГУВАННЯ ПРОФІЛЮ ---
# --- РЕДАГУВАННЯ ПРОФІЛЮ ---
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str   # ВИПРАВЛЕНО: було current_password, узгоджено з фронтендом
    new_password: str

# --- ШАБЛОНИ ---

class TemplateField(BaseModel):
    key: str
    label: str
    type: str = "textarea"
    required: bool = False
    placeholder: Optional[str] = None
    hint: Optional[str] = None
    example: Optional[str] = None


class CharacterTemplateResponse(BaseModel):
    template_name: str
    template_key: str
    description: Optional[str] = None
    role: str
    rank: str
    fields: List[TemplateField] = []
    default_values: Optional[dict] = {}

    model_config = ConfigDict(from_attributes=True)

# --- ФРАКЦІЇ ---
class FactionCreate(BaseModel):
    project_id:  int
    name:        str
    description: Optional[str] = None
    type:        Optional[str] = None
    alignment:   Optional[str] = None
    leader:      Optional[str] = None

class FactionUpdate(BaseModel):
    name:        Optional[str] = None
    description: Optional[str] = None
    type:        Optional[str] = None
    alignment:   Optional[str] = None
    leader:      Optional[str] = None

class FactionCharacterAssignment(BaseModel):
    character_ids: List[int] = []

class FactionResponse(BaseModel):
    id:          int
    project_id:  int
    name:        str
    description: Optional[str] = None
    type:        Optional[str] = None
    alignment:   Optional[str] = None
    leader:      Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# --- СХЕМИ ДЛЯ ЛОКАЦІЙ (МАПА СВІТУ) ---
class LocationCreate(BaseModel):
    project_id: int
    dimension_id: Optional[int] = None
    name: str
    type: Optional[str] = "Країна"
    description: Optional[str] = None
    x: Optional[float] = 400.0
    y: Optional[float] = 300.0
    color: Optional[str] = None

class LocationUpdate(BaseModel):
    dimension_id: Optional[int] = None
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    color: Optional[str] = None

class LocationResponse(BaseModel):
    id: int
    project_id: int
    dimension_id: Optional[int] = None
    name: str
    type: Optional[str] = None
    description: Optional[str] = None
    x: float
    y: float
    color: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- СХЕМИ ДЛЯ ЗВ'ЯЗКІВ МІЖ ЛОКАЦІЯМИ ---
class LocationRelationshipCreate(BaseModel):
    location_id: int
    target_id: int
    relationship_type: str
    strength: int = 0
    description: Optional[str] = None

class LocationRelationshipUpdate(BaseModel):
    relationship_type: Optional[str] = None
    strength: Optional[int] = None
    description: Optional[str] = None

class LocationRelationshipResponse(BaseModel):
    id: int
    location_id: int
    target_id: int
    relationship_type: str
    strength: int
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- ПЕРСОНАЖІ ---
class CharacterCreate(BaseModel):
    project_id:                int
    faction_id:                Optional[int]          = None
    name:                      str
    role:                      Optional[str]          = "Протагоніст"
    is_favorite:               Optional[bool]         = False
    tags:                      Union[List[str], str]  = []
    status:                    Optional[str]          = "Живий"
    rank:                      Optional[str]          = "Другорядний"
    main_location:             Optional[str]          = "Невідомо"
    description:               Optional[str]          = ""
    appearance:                Optional[str]          = ""
    character_traits:          Optional[str]          = ""
    values_beliefs:            Optional[str]          = ""
    motivation_goals:          Optional[str]          = ""
    fears_vulnerabilities:     Optional[str]          = ""
    social_status:             Optional[str]          = ""
    family_origin:             Optional[str]          = ""
    relationships:             Optional[str]          = ""
    reputation:                Optional[str]          = ""
    communication_style:       Optional[str]          = ""
    biography:                 Optional[str]          = ""
    traumas:                   Optional[str]          = ""
    secrets:                   Optional[str]          = ""
    unresolved_conflicts:      Optional[str]          = ""
    character_arc:             Optional[str]          = ""
    skills:                    Optional[str]          = ""
    resources:                 Optional[str]          = ""
    physical_limitations:      Optional[str]          = ""
    psychological_limitations: Optional[str]          = ""
    habits_routines:           Optional[str]          = ""
    self_perception:           Optional[str]          = ""
    allies_perception:         Optional[str]          = ""
    enemies_perception:        Optional[str]          = ""
    contrasts:                 Optional[str]          = ""
    symbols:                   Optional[str]          = ""

# ✅ ВИПРАВЛЕНО: всі поля Optional — можна оновлювати будь-яке одне поле
# без необхідності передавати весь об'єкт
class CharacterUpdate(BaseModel):
    project_id:                Optional[int]          = None
    faction_id:                Optional[int]          = None
    name:                      Optional[str]          = None
    role:                      Optional[str]          = None
    is_favorite:               Optional[bool]         = None
    tags:                      Optional[Union[List[str], str]] = None
    status:                    Optional[str]          = None
    rank:                      Optional[str]          = None
    main_location:             Optional[str]          = None
    description:               Optional[str]          = None
    appearance:                Optional[str]          = None
    character_traits:          Optional[str]          = None
    values_beliefs:            Optional[str]          = None
    motivation_goals:          Optional[str]          = None
    fears_vulnerabilities:     Optional[str]          = None
    social_status:             Optional[str]          = None
    family_origin:             Optional[str]          = None
    relationships:             Optional[str]          = None
    reputation:                Optional[str]          = None
    communication_style:       Optional[str]          = None
    biography:                 Optional[str]          = None
    traumas:                   Optional[str]          = None
    secrets:                   Optional[str]          = None
    unresolved_conflicts:      Optional[str]          = None
    character_arc:             Optional[str]          = None
    skills:                    Optional[str]          = None
    resources:                 Optional[str]          = None
    physical_limitations:      Optional[str]          = None
    psychological_limitations: Optional[str]          = None
    habits_routines:           Optional[str]          = None
    self_perception:           Optional[str]          = None
    allies_perception:         Optional[str]          = None
    enemies_perception:        Optional[str]          = None
    contrasts:                 Optional[str]          = None
    symbols:                   Optional[str]          = None

class CharacterResponse(CharacterCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- ЗВ'ЯЗКИ ---
class CharacterShort(BaseModel):
    id:   int
    name: str
    role: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class RelationshipCreate(BaseModel):
    character_id:      int
    target_id:         int
    relationship_type: str
    strength:          int            = 0
    description:       Optional[str] = ""

class RelationshipUpdate(BaseModel):
    relationship_type: Optional[str] = None
    strength:          Optional[int] = None
    description:       Optional[str] = None

class RelationshipResponse(BaseModel):
    id:                int
    character_id:      int
    target_id:         int
    relationship_type: str
    strength:          int
    description:       Optional[str]          = ""
    character:         Optional[CharacterShort] = None
    target:            Optional[CharacterShort] = None
    model_config = ConfigDict(from_attributes=True)


# --- ЕРИ ---
class EraCreate(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    order_index: Optional[int] = 0
    start_year: Optional[int] = None
    end_year: Optional[int] = None

class EraUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None

class EraResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str] = None
    order_index: int
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


# --- АРКИ ---
class ArcCharacterRoleCreate(BaseModel):
    character_id: int
    role: str = "Учасник"

class ArcCharacterRoleResponse(BaseModel):
    id: int
    character_id: int
    role: str
    character: Optional[CharacterShort] = None
    model_config = ConfigDict(from_attributes=True)

class ArcCreate(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    goal: Optional[str] = None
    genre: Optional[str] = None
    status: Optional[str] = "Запланована"

class ArcUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    goal: Optional[str] = None
    genre: Optional[str] = None
    status: Optional[str] = None

class ArcCharacterAssignment(BaseModel):
    roles: List[ArcCharacterRoleCreate] = []

class ArcResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    goal: Optional[str] = None
    genre: Optional[str] = None
    status: str
    character_roles: List[ArcCharacterRoleResponse] = []
    model_config = ConfigDict(from_attributes=True)


# --- ПРИЧИННІСТЬ ПОДІЙ ---
class EventCausalityCreate(BaseModel):
    cause_event_id: int
    effect_event_id: int
    description: Optional[str] = None

class EventCausalityResponse(BaseModel):
    id: int
    cause_event_id: int
    effect_event_id: int
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# --- ІСТОРІЯ ЗВ'ЯЗКІВ ---
class RelationshipHistoryCreate(BaseModel):
    relationship_id: int
    period_or_year:  Optional[str] = ""
    old_status:      str
    new_status:      str
    description:     Optional[str] = None

class RelationshipHistoryResponse(BaseModel):
    id:              int
    relationship_id: int
    period_or_year:  Optional[str] = ""
    old_status:      str
    new_status:      str
    description:     Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# --- ПОДІЇ / ТАЙМЛАЙН ---
class CharacterEventCreate(BaseModel):
    character_id: int
    year:         int
    event_title:  str
    description:  Optional[str] = None

class CharacterEventResponse(BaseModel):
    id:           int
    character_id: int
    year:         int
    event_title:  str
    description:  Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class EventCreate(BaseModel):
    project_id: int
    era_id: Optional[int] = None  # НОВЕ
    arc_id: Optional[int] = None
    branch_id: Optional[int] = None
    title: str
    description: Optional[str] = ""
    event_type: Optional[str] = "Особиста подія"
    importance: Optional[str] = "Другорядна"
    tags: Optional[str] = None
    year: Optional[int] = None
    date_label: Optional[str] = None
    is_ongoing: Optional[bool] = False
    location: Optional[str] = None
    participant_ids: Optional[List[int]] = []


class EventUpdate(BaseModel):
    era_id: Optional[int] = None  # НОВЕ
    arc_id: Optional[int] = None
    branch_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    importance: Optional[str] = None
    tags: Optional[str] = None
    year: Optional[int] = None
    date_label: Optional[str] = None
    is_ongoing: Optional[bool] = None
    location: Optional[str] = None
    participant_ids: Optional[List[int]] = None


class EventResponse(BaseModel):
    id: int
    project_id: int
    era_id: Optional[int] = None  # НОВЕ
    arc_id: Optional[int] = None
    branch_id: Optional[int] = None
    title: str
    description: Optional[str] = ""
    event_type: Optional[str] = None
    importance: Optional[str] = None
    tags: Optional[str] = None
    year: Optional[int] = None
    date_label: Optional[str] = None
    is_ongoing: bool = False
    location: Optional[str] = None
    participant_ids: Optional[List[int]] = []

    model_config = ConfigDict(from_attributes=True)

    @field_validator('participant_ids', mode='before')
    @classmethod
    def parse_participant_ids(cls, v):
        # Конвертуємо рядок "1,2,3" -> [1,2,3]
        if isinstance(v, str):
            return [int(x) for x in v.split(',') if x.strip().isdigit()]
        if v is None:
            return []
        return v


# --- ГІЛКИ ---
class BranchCreate(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    branch_point_event_id: Optional[int] = None

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    branch_point_event_id: Optional[int] = None

class BranchResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str] = None
    branch_point_event_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


# --- ПРОЄКТИ ---
class ProjectCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    cover_url: Optional[str] = None

class ProjectUpdate(BaseModel):
    title:       Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None

class ProjectResponse(BaseModel):
    id:          int
    title:       str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# --- БІБЛІОТЕКА (WIKI) ---
class WikiArticleLinkCreate(BaseModel):
    entity_type: str   # 'character' | 'faction' | 'location'
    entity_id: int

class WikiArticleLinkResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    model_config = ConfigDict(from_attributes=True)

class WikiArticleCreate(BaseModel):
    project_id: int
    title: str
    category: Optional[str] = "Інше"
    content: Optional[str] = ""
    links: List[WikiArticleLinkCreate] = []

class WikiArticleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None

class WikiArticleLinksAssignment(BaseModel):
    links: List[WikiArticleLinkCreate] = []

class WikiArticleResponse(BaseModel):
    id: int
    project_id: int
    title: str
    category: Optional[str] = None
    content: Optional[str] = ""
    links: List[WikiArticleLinkResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- НАГАДУВАННЯ ("Не забути") ---
class ReminderCreate(BaseModel):
    project_id: int
    text: str

class ReminderUpdate(BaseModel):
    text: Optional[str] = None
    is_done: Optional[bool] = None

class ReminderResponse(BaseModel):
    id: int
    project_id: int
    text: str
    is_done: bool
    model_config = ConfigDict(from_attributes=True)

# --- КАРКАС СЮЖЕТУ ---
class PlotOutlineUpdate(BaseModel):
    logline: Optional[str] = None
    setup: Optional[str] = None
    rising_action: Optional[str] = None
    main_conflict: Optional[str] = None
    key_turns: Optional[str] = None
    resolution_options: Optional[str] = None
    ending: Optional[str] = None

class PlotOutlineResponse(BaseModel):
    id: int
    project_id: int
    logline: Optional[str] = ""
    setup: Optional[str] = ""
    rising_action: Optional[str] = ""
    main_conflict: Optional[str] = ""
    key_turns: Optional[str] = ""
    resolution_options: Optional[str] = ""
    ending: Optional[str] = ""
    model_config = ConfigDict(from_attributes=True)

# --- ВИМІРИ ---
class DimensionCreate(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    color: Optional[str] = None

class DimensionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class DimensionResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# --- САУНДТРЕК ---
class SoundtrackCreate(BaseModel):
    project_id: int
    title: str
    artist: Optional[str] = None
    url: str
    note: Optional[str] = None

class SoundtrackUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    url: Optional[str] = None
    note: Optional[str] = None

class SoundtrackResponse(BaseModel):
    id: int
    project_id: int
    title: str
    artist: Optional[str] = None
    url: str
    note: Optional[str] = ""
    model_config = ConfigDict(from_attributes=True)


# --- МУДБОРД ---
class MoodboardImageCreate(BaseModel):
    project_id: int
    image_url: str
    caption: Optional[str] = None

class MoodboardImageUpdate(BaseModel):
    image_url: Optional[str] = None
    caption: Optional[str] = None

class MoodboardImageResponse(BaseModel):
    id: int
    project_id: int
    image_url: str
    caption: Optional[str] = ""
    model_config = ConfigDict(from_attributes=True)

# --- СТРУКТУРА (довільні блоки) ---
class StructureBlockCreate(BaseModel):
    project_id: int
    title: Optional[str] = "Новий блок"
    content: Optional[str] = ""

class StructureBlockUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class StructureBlockReorder(BaseModel):
    block_ids: List[int]  # повний список id у новому порядку

class StructureBlockResponse(BaseModel):
    id: int
    project_id: int
    title: str
    content: Optional[str] = ""
    order_index: int
    model_config = ConfigDict(from_attributes=True)

# --- ВЛАСНІ СТОРІНКИ ---
class CustomPageCreate(BaseModel):
    project_id: int
    title: str = "Нова сторінка"

class CustomPageUpdate(BaseModel):
    title: Optional[str] = None

class CustomPageResponse(BaseModel):
    id: int
    project_id: int
    title: str
    order_index: int
    model_config = ConfigDict(from_attributes=True)


class CustomPageBlockCreate(BaseModel):
    page_id: int
    title: Optional[str] = "Новий блок"
    content: Optional[str] = ""

class CustomPageBlockUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class CustomPageBlockReorder(BaseModel):
    block_ids: List[int]

class CustomPageBlockResponse(BaseModel):
    id: int
    page_id: int
    title: str
    content: Optional[str] = ""
    order_index: int
    model_config = ConfigDict(from_attributes=True)


# --- ПАПКИ НАВІГАЦІЇ ---
class NavItemCreate(BaseModel):
    item_type: str   # 'built_in' | 'custom_page'
    item_key: str

class NavItemUpdate(BaseModel):
    order_index: Optional[int] = None

class NavItemResponse(BaseModel):
    id: int
    folder_id: int
    item_type: str
    item_key: str
    order_index: int
    model_config = ConfigDict(from_attributes=True)

class NavFolderCreate(BaseModel):
    name: str

class NavFolderUpdate(BaseModel):
    name: Optional[str] = None
    order_index: Optional[int] = None

class NavFolderResponse(BaseModel):
    id: int
    name: str
    order_index: int
    items: List[NavItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


# --- ВЛАСНІ ШАБЛОНИ ПЕРСОНАЖІВ ---
class CustomTemplateFieldCreate(BaseModel):
    key: str  # один із SELECTABLE_FIELD_KEYS на фронтенді
    label: str
    type: Optional[str] = "textarea"
    required: Optional[bool] = False
    placeholder: Optional[str] = None
    hint: Optional[str] = None
    example: Optional[str] = None


class CustomTemplateFieldUpdate(BaseModel):
    label: Optional[str] = None
    type: Optional[str] = None
    required: Optional[bool] = None
    placeholder: Optional[str] = None
    hint: Optional[str] = None
    example: Optional[str] = None


class CustomTemplateFieldReorder(BaseModel):
    field_ids: List[int]


class CustomTemplateFieldResponse(BaseModel):
    id: int
    template_id: int
    key: str
    label: str
    type: str
    required: bool
    placeholder: Optional[str] = None
    hint: Optional[str] = None
    example: Optional[str] = None
    order_index: int
    model_config = ConfigDict(from_attributes=True)


class CustomTemplateCreate(BaseModel):
    project_id: int
    template_name: str = "Новий шаблон"
    description: Optional[str] = None
    role: Optional[str] = "Другорядний персонаж"
    rank: Optional[str] = "Другорядний"


class CustomTemplateUpdate(BaseModel):
    template_name: Optional[str] = None
    description: Optional[str] = None
    role: Optional[str] = None
    rank: Optional[str] = None


class CustomTemplateResponse(BaseModel):
    id: int
    project_id: int
    template_name: str
    description: Optional[str] = None
    role: str
    rank: str
    fields: List[CustomTemplateFieldResponse] = []
    model_config = ConfigDict(from_attributes=True)


# --- ВІДНОВЛЕННЯ ПАРОЛЯ ---
class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
