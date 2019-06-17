import React, {Component} from 'react'
import {Switch, Route} from 'react-router-dom'
import {Link} from 'react-router-dom'
import 'antd/dist/antd.css';
import './App.css'
import {withRouter} from 'react-router-dom'
import { Prompt } from 'react-router-dom'

import {Layout, Menu, Breadcrumb, Input, Card, Row, Col, Icon, Modal, Tag} from 'antd';

const {Meta} = Card;
const {TextArea} = Input;
const {Header, Content, Footer} = Layout;

const cardShadow = {webkitBoxShadow: '1px 1px 10px #eee', boxShadow: '1px 1px 10px #eee'};
const server = 'http://24.7.54.159:22626';


class PageRenderer extends Component {
    render() {
        return <div>
            <h1>{this.props.title}</h1>
            <p><i>{this.props.description}</i></p>
            <h2>Ingredients</h2>
                {Object.keys(this.props.ingredientCategories).map(tableName => (
                    <div>
                        {tableName.length === 0 ? <div/> : <h3>{tableName}</h3>}
                        <ul>
                            {this.props.ingredientCategories[tableName].map(ingredient => {
                                return <li>{ingredient}</li>;
                            })}
                        </ul>
                    </div>
                ))}
            <h2>Directions</h2>
            <p>{this.props.directions}</p>
                {this.props.notes ? <p>{this.props.notes}</p> : <div/>}
        </div>;
    }
}

class EditCard extends Component {
    props = {};
    state = {
        uuid: undefined,
        title: '',
        description: '',
        ingredientCategories: {},
        directions: '',
        notes: '',
        tags: []
    };

    parseIngredientGroups = text => {
        const [first, ...others] = ('\n' + text.trim()).split(/\n(?!(?:\n|\s*-))/g);
        console.log('first', first, 'others', others);
        const groups = {};
        others.forEach(section => {
            const [title, ...lines] = section.trim().split(/\n\s*-\s*/g);
            console.log('of', section)
            console.log('of', section.trim())
            console.log('of', section.trim().split(/\n\s*-\s*/g))
            console.log('of', section.trim().split(/\n/g))
            console.log('title', title, 'lines', lines);
            groups[title] = lines.map(x => x.trim()).filter(x => x.length !== 0);
        });
        const firstGroup = first.split('\n').map(x => x.trim()).filter(x => x.length !== 0);
        if (firstGroup.length !== 0) {
            groups[''] = firstGroup;
        }
        return groups;
    };

    update = (name, event) => {
        console.log(event.target.value);
        this.setState({[name]: event.target.value});
    };

    updater = (name) => {
        return event => {
            this.update(name, event);
        };
    };

    componentWillMount() {
        this.setState({...this.state, ...this.props});
    }

    submit = () => {
        let r;
        if (this.state.uuid) {
            r = fetch(server + '/recipes/' + this.state.uuid, {
                method: 'PUT',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.state), // body data type must match "Content-Type" header
            })
        } else {
            r = fetch(server + '/recipes', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.state), // body data type must match "Content-Type" header
            })
        }
        r.then(r => {
            window.location.href = '/';
        });
    };
    handleLeave = onLeave => {
        Modal.confirm({
            title: 'Are you sure you want to leave?',
            content: 'The new recipe will be lost.',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: () => {
                onLeave();
            },
            onCancel() {
            }
        });
    };
    cancel = () => {
        if (this.state.uuid) {
            Modal.confirm({
                title: 'Are you sure you want to delete this recipe?',
                content: 'This will permanently delete it.',
                okText: 'Yes',
                okType: 'danger',
                cancelText: 'No',
                onOk: () => {
                    fetch(server + '/recipes/' + this.state.uuid, {
                        method: 'DELETE',
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(r => {
                        window.location.href = '/';
                    });
                },
                onCancel() {
                }
            });
        } else {
            this.handleLeave(() => window.location.href = '/');
        }
    };

    render() {
        console.log('PROPS', this.props);
        return <Col xs={24} sm={18} md={14} lg={10} xl={6}>
            <Card
                style={cardShadow}
                actions={[<Icon type="close" onClick={this.cancel}/>,
                    <Icon type="check" onClick={() => this.submit()}/>]}
            >

                <h1>{this.state.uuid ? 'Edit Recipe' : 'Add a New Recipe'}</h1>
                <br/>
                <p>Title:</p>
                <Input placeholder="Title" defaultValue={this.props.title} onChange={e => this.update('title', e)}/>
                <br/>
                <br/>
                <p>Description:</p>
                <TextArea placeholder="Description" defaultValue={this.props.description}
                          onChange={e => this.update('description', e)}
                          autosize={{minRows: 1}}/>
                <br/>
                <br/>
                <p>Ingredients:</p>
                <TextArea placeholder="Ingredients"
                          defaultValue={Object.keys(this.props.ingredientCategories || {}).map(k => (k + '\n - ' + this.props.ingredientCategories[k].join('\n - ')).trim()).join('\n\n')}
                          onChange={e => this.setState({ingredientCategories: this.parseIngredientGroups(e.target.value)})}
                          autosize={{minRows: 3}}/>
                <br/>
                <br/>
                <p>Directions:</p>
                <TextArea placeholder="Directions"
                          defaultValue={this.props.directions}
                          onChange={e => this.update('directions', e)}
                          autosize={{minRows: 3,}}/>
                <br/>
                <br/>
                <p>Notes:</p>
                <Input placeholder="Notes" defaultValue={this.props.notes} onChange={e => this.update('notes', e)}/>
                <br/>
                <br/>
                <p>Tags:</p>
                <Input placeholder='Space separated ie. "dinner simple chicken crockpot"'
                       defaultValue={(this.props.tags || []).join(' ')}
                       onChange={e => this.setState({tags: e.target.value.trim().split(' ').filter(x => x.length !== 0)})}/>
            </Card>
        </Col>;
    }
}

class AddRecipePage extends Component {
    render() {
        return <Row type='flex' justify='center'>
            <EditCard/>
        </Row>;
    }
}

class EditRecipePage extends Component {
    state = {recipe: undefined};

    componentWillMount() {
        fetch(server + '/recipes/' + this.props.match.params.recipeUuid, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(r => r.json()).then(r => this.setState({recipe: r}));
    }

    render() {
        return <Row type='flex' justify='center'>
            {this.state.recipe ? <EditCard {...this.state.recipe}/> : <></>}
        </Row>;
    }
}

class RecipeCard extends Component {
    render() {
        console.log(this.props);
        return <Col xs={24} sm={18} md={14} lg={10} xl={6}>
            <Card style={cardShadow} title={this.props.title[0].toUpperCase() + this.props.title.substr(1)} extra={this.props.tags.map(tag => <Link to={'/tag/' + tag}><Tag>{tag}</Tag></Link>)} actions={[
                <Link to={'/view/' + this.props.uuid}><Icon type="eye"/></Link>,
                <Link to={'/edit/' + this.props.uuid}><Icon type="edit" onClick={this.cancel}/></Link>
            ]}>
                <p><i>{this.props.description}</i></p>
                <h2>Ingredients</h2>
                {Object.keys(this.props.ingredientCategories).map(tableName => (
                    <div>
                        {this.props.ingredientCategories[tableName].length === 0 ? <div/> : <h3>{tableName}</h3>}
                        <ul>
                            {this.props.ingredientCategories[tableName].map(ingredient => {
                                return <li>{ingredient}</li>;
                            })}
                        </ul>
                    </div>
                ))}
                <h2>Directions</h2>
                <p>{this.props.directions}</p>
                {this.props.notes ? <p>{this.props.notes}</p> : <div/>}
            </Card>
        </Col>;
    }
}

class MainPageRenderer extends Component {
    render() {
        return <div>
            <h1>Gluten Free Cooking</h1>
            <p>Welcome to the GF Cooking homepage</p>
            <Row gutter={20} type='flex' style={{alignContent: 'stretch'}}>
                {this.props.recipes.map(fn => {
                    return <RecipeCard {...fn}/>;
                })}
            </Row>
        </div>
    }
}


class App extends Component {

    listUrl = 'https://raw.githubusercontent.com/gfcooking/recipes/master/RecipeList.txt';

    state = {recipes: []};

    componentWillMount() {
        fetch(server + '/recipes', {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(r => r.json()).then(r => this.setState({recipes: r}));
    }

    pathParts = () => {
        return this.props.location.pathname.split('/').filter(x => x);
    };

    render() {
        return (
            <Layout className="layout">
                <Header>
                    <div className="logo"/>
                    <Menu
                        theme="dark"
                        mode="horizontal"
                        defaultSelectedKeys={['1']}
                        style={{lineHeight: '64px'}}
                    >
                        <Menu.Item key="1" active><a href="/#">Home</a></Menu.Item>
                        <Menu.Item key="2" active><Link to='/add'>New Recipe</Link></Menu.Item>
                    </Menu>
                </Header>
                <Content style={{padding: '0 50px'}} className='Site-content' breakpoint='sm' onBreakpoint={broken => console.log('BREAK', broken)}>
                    <Breadcrumb style={{margin: '16px 0'}} linkRender={undefined} nameRender={undefined}
                                params={undefined} prefixCls={undefined} routes={undefined}>
                        {['Home', ...this.pathParts()].filter(x => x.length < 30).map(i => <Breadcrumb.Item><a
                            href={'/#' + i.replace('Home', '')}>{i}</a></Breadcrumb.Item>)}
                    </Breadcrumb>
                    <div style={{background: '#fff', padding: 24, minHeight: 280, height: '100%'}}>
                        <Switch>
                            <Route exact path='/add' component={AddRecipePage}/>
                            <Route exact path='/edit/:recipeUuid' component={EditRecipePage}/>
                            <Route exact path='/' component={() => <MainPageRenderer recipes={this.state.recipes}/>}/>
                            <Route exact path='/tag/:tag' component={props => <MainPageRenderer recipes={this.state.recipes.filter(x => x.tags.includes(props.match.params.tag))}/>}/>
                            {this.state.recipes.map(recipe => {
                            return <Route exact path={'/view/' + recipe.uuid}
                            render={() => <PageRenderer {...recipe}/>}/>
                            })}
                        </Switch>
                    </div>
                </Content>
                <Footer style={{textAlign: 'center'}}>
                    Copyright © 2019 Scholefield
                </Footer>
            </Layout>
        );
    }
}

export default withRouter(App);
