from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float
import enum
from sqlalchemy.orm import relationship
from .database import Base


class RelationshipTypeEnum(str, enum.Enum):
    FAMILY      = "Родина"
    ROMANCE     = "Романтика"
    FRIENDSHIP  = "Дружба"
    ENMITY      = "Ворожнеча"
    WORK        = "Робота"
    MENTORSHIP  = "Наставництво"
    DEBT        = "Борг"
    SECRET      = "Таємниця"
    ALLY        = "Союзник"
    RIVAL       = "Суперник"


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, nullable=False, index=True)
    username      = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, index=True)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    characters = relationship("Character", back_populates="project", cascade="all, delete-orphan")
    factions   = relationship("Faction",   back_populates="project", cascade="all, delete-orphan")
    locations  = relationship("Location",  back_populates="project", cascade="all, delete-orphan")
    # ✅ ДОДАНО
    events = relationship("Event", back_populates="project", cascade="all, delete-orphan")
    # НОВЕ:
    eras = relationship("Era", back_populates="project", cascade="all, delete-orphan")
    arcs = relationship("Arc", back_populates="project", cascade="all, delete-orphan")
    branches = relationship("Branch", back_populates="project", cascade="all, delete-orphan")
    owner      = relationship("User", back_populates="projects")
    wiki_articles = relationship("WikiArticle", back_populates="project", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="project", cascade="all, delete-orphan")
    plot_outline = relationship("PlotOutline", back_populates="project", uselist=False, cascade="all, delete-orphan")
    dimensions = relationship("Dimension", back_populates="project", cascade="all, delete-orphan")

class Faction(Base):
    __tablename__ = "factions"

    id          = Column(Integer, primary_key=True, index=True)
    project_id  = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    name        = Column(String, index=True)
    description = Column(String, default="")
    type        = Column(String, nullable=True)
    alignment   = Column(String, nullable=True)
    leader      = Column(String, nullable=True)

    project    = relationship("Project",   back_populates="factions")
    characters = relationship("Character", back_populates="faction")


class Location(Base):
    __tablename__ = "locations"

    id          = Column(Integer, primary_key=True, index=True)
    project_id  = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    dimension_id = Column(Integer, ForeignKey("dimensions.id"), nullable=True)
    name        = Column(String, index=True)
    type        = Column(String, default="Країна")
    description = Column(Text,   default="")
    x           = Column(Float,  default=400.0)
    y           = Column(Float,  default=300.0)
    color       = Column(String, nullable=True)

    project = relationship("Project", back_populates="locations")
    dimension = relationship("Dimension", back_populates="locations")


class Dimension(Base):
    __tablename__ = "dimensions"

    id          = Column(Integer, primary_key=True, index=True)
    project_id  = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    name        = Column(String, nullable=False)
    description = Column(Text, default="")
    color       = Column(String, nullable=True)

    project   = relationship("Project", back_populates="dimensions")
    locations = relationship("Location", back_populates="dimension")


class LocationRelationship(Base):
    __tablename__ = "location_relationships"

    id                = Column(Integer, primary_key=True, index=True)
    location_id       = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"))
    target_id         = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"))
    relationship_type = Column(String,  nullable=False)
    strength          = Column(Integer, default=0)
    description       = Column(Text,    default="")


class Character(Base):
    __tablename__ = "characters"

    id         = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), index=True)
    faction_id = Column(Integer, ForeignKey("factions.id"), nullable=True)

    name        = Column(String,  nullable=False)
    role        = Column(String,  default="Другорядний")
    is_favorite = Column(Boolean, default=False)
    tags        = Column(String,  nullable=True)

    status = Column(String, default="Живий")
    rank   = Column(String, default="Другорядний")

    description               = Column(Text, default="")
    appearance                = Column(Text, default="")
    character_traits          = Column(Text, default="")
    values_beliefs            = Column(Text, default="")
    motivation_goals          = Column(Text, default="")
    fears_vulnerabilities     = Column(Text, default="")
    social_status             = Column(Text, default="")
    family_origin             = Column(Text, default="")
    relationships             = Column(Text, default="")
    reputation                = Column(Text, default="")
    communication_style       = Column(Text, default="")
    biography                 = Column(Text, default="")
    traumas                   = Column(Text, default="")
    secrets                   = Column(Text, default="")
    unresolved_conflicts      = Column(Text, default="")
    character_arc             = Column(Text, default="")
    skills                    = Column(Text, default="")
    resources                 = Column(Text, default="")
    physical_limitations      = Column(Text, default="")
    psychological_limitations = Column(Text, default="")
    habits_routines           = Column(Text, default="")
    self_perception           = Column(Text, default="")
    allies_perception         = Column(Text, default="")
    enemies_perception        = Column(Text, default="")
    contrasts                 = Column(Text, default="")
    symbols                   = Column(Text, default="")
    main_location             = Column(String, default="Невідомо")

    project = relationship("Project",        back_populates="characters")
    faction = relationship("Faction",        back_populates="characters")
    events  = relationship("CharacterEvent", back_populates="character", cascade="all, delete-orphan")

    outgoing_relationships = relationship(
        "CharacterRelationship",
        foreign_keys="CharacterRelationship.character_id",
        back_populates="character",
        cascade="all, delete-orphan",
    )
    incoming_relationships = relationship(
        "CharacterRelationship",
        foreign_keys="CharacterRelationship.target_id",
        back_populates="target",
        cascade="all, delete-orphan",
    )


class CharacterRelationship(Base):
    __tablename__ = "character_relationships"

    id                = Column(Integer, primary_key=True, index=True)
    character_id      = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"))
    target_id         = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"))
    relationship_type = Column(String,  nullable=False)
    strength          = Column(Integer, default=0)
    description       = Column(Text,    default="")

    character = relationship("Character", foreign_keys=[character_id], back_populates="outgoing_relationships")
    target    = relationship("Character", foreign_keys=[target_id],    back_populates="incoming_relationships")

    history = relationship("RelationshipHistory", back_populates="parent_relationship", cascade="all, delete-orphan")


class CharacterEvent(Base):
    __tablename__ = "character_events"

    id           = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"))
    year         = Column(Integer)
    event_title  = Column(String, index=True)
    description  = Column(Text,   default="")

    character = relationship("Character", back_populates="events")


class EventImportanceEnum(str, enum.Enum):
    MAIN       = "Основна"
    SECONDARY  = "Другорядна"
    BACKGROUND = "Фонова"


class Event(Base):
    __tablename__ = "events"

    id          = Column(Integer, primary_key=True, index=True)
    project_id  = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    # НОВЕ:
    era_id      = Column(Integer, ForeignKey("eras.id"), nullable=True)
    arc_id      = Column(Integer, ForeignKey("arcs.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)

    title       = Column(String,  nullable=False)
    description = Column(Text,    default="")
    event_type  = Column(String,  default="Особиста подія")
    importance  = Column(String,  default="Другорядна")
    tags        = Column(String,  nullable=True)

    year        = Column(Integer, nullable=True)
    date_label  = Column(String,  nullable=True)
    is_ongoing  = Column(Boolean, default=False)

    location        = Column(String, nullable=True)
    participant_ids = Column(String, nullable=True)

    project = relationship("Project", back_populates="events")
    # НОВЕ:
    era = relationship("Era", back_populates="events")
    arc = relationship("Arc", back_populates="events")
    branch = relationship("Branch", back_populates="events", foreign_keys=[branch_id])


class Era(Base):
    __tablename__ = "eras"

    id          = Column(Integer, primary_key=True, index=True)
    project_id  = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    name        = Column(String, nullable=False)
    description = Column(Text, default="")
    order_index = Column(Integer, default=0)   # для сортування ер незалежно від тексту
    start_year  = Column(Integer, nullable=True)
    end_year    = Column(Integer, nullable=True)

    project = relationship("Project", back_populates="eras")
    events  = relationship("Event", back_populates="era")


class Arc(Base):
    __tablename__ = "arcs"

    id          = Column(Integer, primary_key=True, index=True)
    project_id  = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title       = Column(String, nullable=False)
    description = Column(Text, default="")
    goal        = Column(Text, default="")
    genre       = Column(String, nullable=True)
    status      = Column(String, default="Запланована")  # Запланована / Активна / Завершена

    project         = relationship("Project", back_populates="arcs")
    events          = relationship("Event", back_populates="arc")
    character_roles = relationship("ArcCharacterRole", back_populates="arc", cascade="all, delete-orphan")


class ArcCharacterRole(Base):
    __tablename__ = "arc_character_roles"

    id           = Column(Integer, primary_key=True, index=True)
    arc_id       = Column(Integer, ForeignKey("arcs.id", ondelete="CASCADE"))
    character_id = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"))
    role         = Column(String, default="Учасник")  # протагоніст / антагоніст / союзник тощо

    arc       = relationship("Arc", back_populates="character_roles")
    character = relationship("Character")


class EventCausality(Base):
    __tablename__ = "event_causalities"

    id               = Column(Integer, primary_key=True, index=True)
    cause_event_id   = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"))
    effect_event_id  = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"))
    description      = Column(Text, default="")


class Branch(Base):
    __tablename__ = "branches"

    id          = Column(Integer, primary_key=True, index=True)
    project_id  = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    name        = Column(String, nullable=False)
    description = Column(Text, default="")
    # Подія в основній лінії, від якої відгалужується ця альтернативна версія
    branch_point_event_id = Column(Integer, ForeignKey("events.id"), nullable=True)

    project = relationship("Project", back_populates="branches")
    events  = relationship("Event", back_populates="branch", foreign_keys="Event.branch_id")


class RelationshipHistory(Base):
    __tablename__ = "relationship_history"

    id              = Column(Integer, primary_key=True, index=True)
    relationship_id = Column(Integer, ForeignKey("character_relationships.id", ondelete="CASCADE"))
    period_or_year  = Column(String,  nullable=True)
    old_status      = Column(String,  nullable=True)
    new_status      = Column(String)
    description     = Column(Text,    default="")
    parent_relationship = relationship("CharacterRelationship", back_populates="history")

class WikiArticle(Base):
    __tablename__ = "wiki_articles"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title = Column(String, nullable=False)
    category = Column(String, default="Інше")  # Магія / Зброя / Релігія / Флора і фауна / Культура / Історія / Інше
    content = Column(Text, default="")

    project = relationship("Project", back_populates="wiki_articles")
    links = relationship("WikiArticleLink", back_populates="article", cascade="all, delete-orphan")

class WikiArticleLink(Base):
    __tablename__ = "wiki_article_links"

    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("wiki_articles.id", ondelete="CASCADE"))
    entity_type = Column(String, nullable=False)  # 'character' | 'faction' | 'location'
    entity_id = Column(Integer, nullable=False)

    article = relationship("WikiArticle", back_populates="links")

class Reminder(Base):
    __tablename__ = "reminders"

    id         = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    text       = Column(Text, nullable=False)
    is_done    = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="reminders")

class PlotOutline(Base):
    __tablename__ = "plot_outlines"

    id         = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), unique=True, index=True)

    logline             = Column(Text, default="")  # Про що історія (1-2 речення)
    setup                = Column(Text, default="")  # Зав'язка
    rising_action        = Column(Text, default="")  # Розкачка
    main_conflict        = Column(Text, default="")  # Основний конфлікт
    key_turns            = Column(Text, default="")  # Ключові повороти
    resolution_options   = Column(Text, default="")  # Варіанти вирішення
    ending               = Column(Text, default="")  # Фінал

    project = relationship("Project", back_populates="plot_outline")